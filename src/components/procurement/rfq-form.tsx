"use client";

/*
 * Why this file is a client component (§15 rule 3): the submit, the dynamic
 * item rows and the antiforgery hand-off are interactivity, and only the
 * browser can know whether a session exists (session-provider).
 *
 * Request For Quote (business-flows §3.8, api.md §2.6). One submit is two real
 * round trips, exactly as the API models them: POST /rfqs creates the Draft the
 * buyer can still revise, then POST /rfqs/{id}/submit runs the server's
 * matching pipeline and dispatches it. Nothing is faked in between — the
 * confirmation shows the server's own reference code and the suppliers it
 * actually matched.
 *
 * The department and unit choices arrive as server-rendered props (read from
 * the live catalogue), so the client fetches no taxonomy and the server stays
 * the authority on which slugs and codes exist.
 */

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/session-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { ApiClientError, rfqApi, resolveErrorCopy, type CreateRfqRequest, type RfqResponse } from "@/lib/api";
import { fieldErrorsToRecord, type FieldFailures } from "@/lib/validation/auth";
import {
  itemFieldKey,
  serverFieldKey,
  validateRfq,
  type RfqFormValues,
  type RfqItemValues,
} from "@/lib/validation/rfq";

/** One selectable department, server-supplied from the live category tree. */
export interface DepartmentOption {
  slug: string;
  name: string;
}

/** One unit of measure, server-supplied from the live reference table. */
export interface UnitOption {
  code: string;
  name: string;
}

interface ItemState extends RfqItemValues {
  /** Stable identity for React keys and element ids; never random (SSR parity). */
  id: number;
}

interface FormState extends Omit<RfqFormValues, "items"> {
  items: ItemState[];
}

/** The text-valued controls `setField` drives; the one boolean has its own handler. */
type StringField = Exclude<keyof Omit<FormState, "items">, "substitutionsAllowed">;

const EMPTY_ITEM: RfqItemValues = {
  description: "",
  quantity: "",
  categorySlug: "",
  unitOfMeasureCode: "",
  specification: "",
};

const INITIAL: FormState = {
  title: "",
  companyName: "",
  registrationNumber: "",
  website: "",
  deliveryLocationText: "",
  substitutionsAllowed: true,
  specialInstructions: "",
  expiryDays: "14",
  items: [{ ...EMPTY_ITEM, id: 0 }],
};

/** RFQ status enum → `rfq` message key; an unknown future status shows its raw name rather than vanishing. */
const STATUS_KEYS: Record<string, string> = {
  Draft: "statusDraft",
  Submitted: "statusSubmitted",
  Matching: "statusMatching",
  Dispatched: "statusDispatched",
  Cancelled: "statusCancelled",
  Closed: "statusClosed",
  Awarded: "statusAwarded",
  Expired: "statusExpired",
};

export function RfqForm({
  departments,
  units,
}: {
  departments: DepartmentOption[];
  units: UnitOption[];
}) {
  const { status, user, csrfToken } = useSession();
  const t = useTranslations("rfq");
  const tValidation = useTranslations("rfq.validation");
  const tLabels = useTranslations("common.labels");
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");
  const tA11y = useTranslations("a11y");
  const tStates = useTranslations("common.states");
  const baseId = useId();
  const nextItemId = useRef(1);

  const [values, setValues] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<RfqResponse | null>(null);
  const [recentVersion, setRecentVersion] = useState(0);

  if (status === "loading") {
    return <p className="type-body-sm text-ink-muted">{tStates("loading")}</p>;
  }

  if (status !== "signedIn" || !user) {
    return (
      <div className="rounded-md border border-line bg-surface-panel p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("signInTitle")}</h2>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{t("signInBody")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/login" variant="primary" size="md">
            {tActions("signIn")}
          </ButtonLink>
          <ButtonLink href="/register" variant="secondary" size="md">
            {tActions("register")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const needsCompany = user.orgMemberships.length === 0;

  /*
   * Capability pre-emption. The backend is the authority on this action
   * (`rfq.create`, checked by the security suite), and the session already
   * carries the answer: a supplier account can sign in here but can never
   * create a request. Saying so up front beats rendering a form whose submit
   * is guaranteed to come back 403 — the request is real either way.
   */
  if (!user.permissions.includes("rfq.create")) {
    return (
      <div className="rounded-md border border-line bg-surface-panel p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("notBuyerTitle")}</h2>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{t("notBuyerBody")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/register" variant="primary" size="md">
            {t("notBuyerCta")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const setField =
    (field: StringField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((previous) => ({ ...previous, [field]: value }));
      setFieldErrors((previous) =>
        previous[field] ? { ...previous, [field]: undefined } : previous,
      );
    };

  const setItem =
    (index: number, field: keyof RfqItemValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setValues((previous) => ({
        ...previous,
        items: previous.items.map((item, position) =>
          position === index ? { ...item, [field]: value } : item,
        ),
      }));
      const key = itemFieldKey(index, field);
      setFieldErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));
    };

  const addItem = (): void => {
    const id = nextItemId.current++;
    setValues((previous) => ({ ...previous, items: [...previous.items, { ...EMPTY_ITEM, id }] }));
  };

  const removeItem = (index: number): void => {
    setValues((previous) =>
      previous.items.length <= 1
        ? previous
        : { ...previous, items: previous.items.filter((_, position) => position !== index) },
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validateRfq(values, needsCompany, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setBanner(null);
    setSubmitting(true);
    try {
      const token = await csrfToken();
      const draft = await rfqApi.create(buildRequest(values, needsCompany), token);
      const dispatched = await rfqApi.submit(draft.id, token);
      setSubmitted(dispatched);
      setRecentVersion((version) => version + 1);
    } catch (error) {
      if (error instanceof ApiClientError && error.envelope?.code === "VALIDATION_FAILED") {
        const server = fieldErrorsToRecord(error.envelope.fieldErrors, tValidation);
        const mapped: FieldFailures = {};
        for (const [key, message] of Object.entries(server)) mapped[serverFieldKey(key)] = message;
        setFieldErrors((previous) => ({ ...previous, ...mapped }));
        if (Object.keys(mapped).length === 0) setBanner(resolveErrorCopy(tErrors, error));
      } else {
        setBanner(resolveErrorCopy(tErrors, error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div
          role="status"
          className="rounded-md border border-line bg-surface-panel p-6"
        >
          <h2 className="font-display text-xl font-bold text-ink">{t("successTitle")}</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">
            {t("successBody", { reference: submitted.referenceCode })}
          </p>
          <p className="mt-1 font-body text-sm text-ink-muted">
            {t("successMatches", { count: submitted.matches.length })}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setSubmitted(null);
                setValues(INITIAL);
              }}
            >
              {t("sendAnother")}
            </Button>
          </div>
        </div>
        <RecentRequests version={recentVersion} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <form noValidate aria-busy={submitting} onSubmit={onSubmit} className="flex flex-col gap-6">
        {banner && (
          <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
            {banner}
          </p>
        )}

        <FormField
          id={`${baseId}-title`}
          label={t("titleLabel")}
          required
          requiredText={tA11y("requiredField")}
          error={fieldErrors.title}
        >
          {(control) => (
            <input
              {...control}
              type="text"
              value={values.title}
              onChange={setField("title")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        {needsCompany && (
          <fieldset className="flex flex-col gap-4 rounded-md border border-line bg-surface-panel p-4">
            <legend className="type-label text-ink-muted">{t("companyLegend")}</legend>
            <p className="type-meta text-ink-muted">{t("companyHint")}</p>
            <FormField
              id={`${baseId}-company`}
              label={tLabels("companyName")}
              required
              requiredText={tA11y("requiredField")}
              error={fieldErrors.companyName}
            >
              {(control) => (
                <input
                  {...control}
                  type="text"
                  autoComplete="organization"
                  value={values.companyName}
                  onChange={setField("companyName")}
                  disabled={submitting}
                  className={fieldControlClassName}
                />
              )}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id={`${baseId}-registration`} label={tLabels("registrationNumber")}>
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    value={values.registrationNumber}
                    onChange={setField("registrationNumber")}
                    disabled={submitting}
                    className={fieldControlClassName}
                  />
                )}
              </FormField>
              <FormField id={`${baseId}-website`} label={tLabels("website")}>
                {(control) => (
                  <input
                    {...control}
                    type="url"
                    autoComplete="url"
                    value={values.website}
                    onChange={setField("website")}
                    disabled={submitting}
                    className={fieldControlClassName}
                  />
                )}
              </FormField>
            </div>
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${baseId}-delivery`} label={t("deliveryLocationLabel")}>
            {(control) => (
              <input
                {...control}
                type="text"
                value={values.deliveryLocationText}
                onChange={setField("deliveryLocationText")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>
          <FormField
            id={`${baseId}-expiry`}
            label={t("expiryDaysLabel")}
            hint={t("expiryDaysHint")}
          >
            {(control) => (
              <input
                {...control}
                type="number"
                inputMode="numeric"
                min={1}
                value={values.expiryDays}
                onChange={setField("expiryDays")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>
        </div>

        <FormField id={`${baseId}-instructions`} label={t("specialInstructionsLabel")}>
          {(control) => (
            <textarea
              {...control}
              rows={3}
              value={values.specialInstructions}
              onChange={setField("specialInstructions")}
              disabled={submitting}
              className={`${fieldControlClassName} h-auto py-2`}
            />
          )}
        </FormField>

        <label className="type-body-sm flex items-start gap-2 text-ink">
          <input
            type="checkbox"
            checked={values.substitutionsAllowed}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                substitutionsAllowed: event.target.checked,
              }))
            }
            disabled={submitting}
            className="mt-1 size-4 shrink-0 rounded-sm border border-line-strong accent-brand-primary"
          />
          {t("substitutionsLabel")}
        </label>

        <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
          <legend className="type-label text-ink-muted">{t("itemsLegend")}</legend>

          {values.items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-md border border-line p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="type-label text-ink-muted">{t("itemLegend", { number: index + 1 })}</p>
                {values.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={submitting}
                    className="type-meta text-danger underline underline-offset-2 hover:text-ink disabled:opacity-50"
                  >
                    {tActions("remove")}
                  </button>
                )}
              </div>

              <FormField
                id={`${baseId}-item-${item.id}-description`}
                label={tLabels("description")}
                required
                requiredText={tA11y("requiredField")}
                error={fieldErrors[itemFieldKey(index, "description")]}
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    value={item.description}
                    onChange={setItem(index, "description")}
                    disabled={submitting}
                    className={fieldControlClassName}
                  />
                )}
              </FormField>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  id={`${baseId}-item-${item.id}-quantity`}
                  label={tLabels("quantity")}
                  required
                  requiredText={tA11y("requiredField")}
                  error={fieldErrors[itemFieldKey(index, "quantity")]}
                >
                  {(control) => (
                    <input
                      {...control}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={item.quantity}
                      onChange={setItem(index, "quantity")}
                      disabled={submitting}
                      className={fieldControlClassName}
                    />
                  )}
                </FormField>

                <FormField id={`${baseId}-item-${item.id}-unit`} label={tLabels("unit")}>
                  {(control) => (
                    <select
                      {...control}
                      value={item.unitOfMeasureCode}
                      onChange={setItem(index, "unitOfMeasureCode")}
                      disabled={submitting}
                      className={fieldControlClassName}
                    >
                      <option value="">{t("unitAny")}</option>
                      {units.map((unit) => (
                        <option key={unit.code} value={unit.code}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>

                <FormField
                  id={`${baseId}-item-${item.id}-category`}
                  label={tLabels("category")}
                  error={fieldErrors[itemFieldKey(index, "categorySlug")]}
                >
                  {(control) => (
                    <select
                      {...control}
                      value={item.categorySlug}
                      onChange={setItem(index, "categorySlug")}
                      disabled={submitting}
                      className={fieldControlClassName}
                    >
                      <option value="">{t("categoryAny")}</option>
                      {departments.map((department) => (
                        <option key={department.slug} value={department.slug}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>
              </div>

              <FormField
                id={`${baseId}-item-${item.id}-specification`}
                label={t("specificationLabel")}
                hint={t("specificationHint")}
              >
                {(control) => (
                  <input
                    {...control}
                    type="text"
                    value={item.specification}
                    onChange={setItem(index, "specification")}
                    disabled={submitting}
                    className={fieldControlClassName}
                  />
                )}
              </FormField>
            </div>
          ))}

          <div>
            <Button type="button" variant="ghost" size="sm" onClick={addItem} disabled={submitting}>
              {t("addItem")}
            </Button>
          </div>
        </fieldset>

        <div>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? t("submitting") : t("submitCta")}
          </Button>
        </div>
      </form>

      <RecentRequests version={recentVersion} />
    </div>
  );
}

/** The buyer's own recent requests — a real read of GET /me/rfqs, only when signed in. */
function RecentRequests({ version }: { version: number }) {
  const t = useTranslations("rfq");
  const tErrors = useTranslations("errors");
  const [requests, setRequests] = useState<RfqResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const statusLabel = (status: string): string => {
    const key = STATUS_KEYS[status];
    return key && t.has(key) ? t(key) : status;
  };

  useEffect(() => {
    let cancelled = false;
    rfqApi
      .mine()
      .then((rows) => {
        if (!cancelled) {
          setRequests(rows);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRequests([]);
          setLoadError(resolveErrorCopy(tErrors, error) || t("recentLoadError"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version, t, tErrors]);

  if (requests === null) return null;

  if (loadError) {
    return (
      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("recentTitle")}</h2>
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {loadError}
        </p>
      </section>
    );
  }

  if (requests.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="font-display text-lg font-bold text-ink">{t("recentTitle")}</h2>
      <ul className="flex flex-col divide-y divide-line">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
            <span className="font-body text-sm font-semibold text-ink">{request.title}</span>
            <span className="type-meta text-ink-muted">
              {request.referenceCode} · {statusLabel(request.status)} ·{" "}
              {t("recentMatches", { count: request.matches.length })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Assemble the wire body; optional members are omitted, never null (api.md §1.4). */
function buildRequest(values: FormState, needsCompany: boolean): CreateRfqRequest {
  const trimmedExpiry = values.expiryDays.trim();
  const expiryDays = /^\d+$/.test(trimmedExpiry) && Number(trimmedExpiry) > 0
    ? Number(trimmedExpiry)
    : undefined;

  return {
    title: values.title.trim(),
    company: needsCompany
      ? {
          name: values.companyName.trim(),
          registrationNumber: values.registrationNumber.trim() || undefined,
          website: values.website.trim() || undefined,
        }
      : undefined,
    deliveryLocationText: values.deliveryLocationText.trim() || undefined,
    substitutionsAllowed: values.substitutionsAllowed,
    specialInstructions: values.specialInstructions.trim() || undefined,
    expiryDays,
    items: values.items.map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity),
      categorySlug: item.categorySlug || undefined,
      unitOfMeasureCode: item.unitOfMeasureCode || undefined,
      specification: item.specification.trim() || undefined,
    })),
  };
}
