import React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/utils";
import { EventType } from "../services/availabilityService";
import { PhoneInput } from "./PhoneInput";

interface BookingFormProps {
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  event: EventType;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  isSubmitting,
  event,
}) => {
  const [formData, setFormData] = React.useState<any>({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    guests: [] as string[],
    customAnswers: {} as Record<string, any>,
  });

  const [showGuestInput, setShowGuestInput] = React.useState(false);
  const [guestEmail, setGuestEmail] = React.useState("");

  const [errors, setErrors] = React.useState({
    email: "",
  });

  // Autofill logic
  React.useEffect(() => {
    if (event.autofill_enabled) {
      const savedData = localStorage.getItem("invitee_details");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData((prev: any) => ({
            ...prev,
            name: parsed.name || prev.name,
            firstName: parsed.firstName || prev.firstName,
            lastName: parsed.lastName || prev.lastName,
            email: parsed.email || prev.email,
          }));
        } catch (e) {
          console.error("Error parsing saved invitee details", e);
        }
      }
    }
  }, [event.autofill_enabled]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddGuest = () => {
    if (guestEmail && validateEmail(guestEmail)) {
      setFormData((prev: any) => ({
        ...prev,
        guests: [...prev.guests, guestEmail],
      }));
      setGuestEmail("");
      setShowGuestInput(false);
    }
  };

  const handleRemoveGuest = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      guests: prev.guests.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    // Save to local storage if autofill is enabled
    if (event.autofill_enabled) {
      const dataToSave = {
        name: formData.name,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };
      localStorage.setItem("invitee_details", JSON.stringify(dataToSave));
    }

    setErrors({ email: "" });
    onSubmit(formData);
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-2xl overflow-y-auto h-full custom-scrollbar bg-white">
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 text-center md:text-left">
        Enter Details
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-md mx-auto md:mx-0"
      >
        {event.invitee_detail_type === "first_last_email" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                First Name *
              </label>
              <input
                required
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Last Name *
              </label>
              <input
                required
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Name *
            </label>
            <input
              required
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            Email *
          </label>
          <input
            required
            type="email"
            className={cn(
              "w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all",
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
            )}
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email)
                validateEmail(e.target.value) && setErrors({ email: "" });
            }}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.email}
            </p>
          )}
        </div>

        {event.allow_guests && (
          <div className="space-y-3">
            {formData.guests.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Guests
                </label>
                {formData.guests.map((guest: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <span className="text-sm text-slate-600">{guest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGuest(idx)}
                      className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showGuestInput ? (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Guest Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGuestInput(false)}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGuestInput(true)}
                className="text-blue-600 font-bold border border-blue-600 rounded-full px-4 py-1.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Guests
              </button>
            )}
          </div>
        )}

        {/* Custom Questions */}
        {event.questions
          ?.filter((q) => q.status)
          .map((q) => (
            <div key={q.id} className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                {q.label} {q.required && "*"}
              </label>

              {q.type === "textarea" ? (
                <textarea
                  required={q.required}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none min-h-[100px]"
                  value={formData.customAnswers[q.id] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customAnswers: {
                        ...formData.customAnswers,
                        [q.id]: e.target.value,
                      },
                    })
                  }
                />
              ) : q.type === "text" ? (
                <input
                  required={q.required}
                  type="text"
                  maxLength={255}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.customAnswers[q.id] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customAnswers: {
                        ...formData.customAnswers,
                        [q.id]: e.target.value,
                      },
                    })
                  }
                />
              ) : q.type === "phone" ? (
                <PhoneInput
                  required={q.required}
                  value={formData.customAnswers[q.id] || ""}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      customAnswers: { ...formData.customAnswers, [q.id]: val },
                    })
                  }
                  placeholder="Phone number"
                />
              ) : q.type === "select" ? (
                <div className="space-y-2">
                  <select
                    required={q.required}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    value={formData.customAnswers[q.id]?.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        customAnswers: {
                          ...formData.customAnswers,
                          [q.id]: {
                            ...formData.customAnswers[q.id],
                            value: val,
                          },
                        },
                      });
                    }}
                  >
                    <option value="">Select an option</option>
                    {q.options
                      ?.filter((opt) => opt.trim())
                      .map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    {q.includeOther && <option value="Other">Other</option>}
                  </select>
                  {q.includeOther &&
                    formData.customAnswers[q.id]?.value === "Other" && (
                      <input
                        type="text"
                        required
                        placeholder="Other"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.customAnswers[q.id]?.otherValue || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customAnswers: {
                              ...formData.customAnswers,
                              [q.id]: {
                                ...formData.customAnswers[q.id],
                                otherValue: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    )}
                </div>
              ) : q.type === "radio" ? (
                <div className="space-y-3">
                  {q.options
                    ?.filter((opt) => opt.trim())
                    .map((opt, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            required={
                              q.required && !formData.customAnswers[q.id]?.value
                            }
                            checked={
                              formData.customAnswers[q.id]?.value === opt
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                customAnswers: {
                                  ...formData.customAnswers,
                                  [q.id]: {
                                    ...formData.customAnswers[q.id],
                                    value: opt,
                                  },
                                },
                              })
                            }
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all",
                              formData.customAnswers[q.id]?.value === opt
                                ? "border-blue-600 bg-white"
                                : "border-slate-300 group-hover:border-slate-400",
                            )}
                          />
                          {formData.customAnswers[q.id]?.value === opt && (
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    ))}
                  {q.includeOther && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            required={
                              q.required && !formData.customAnswers[q.id]?.value
                            }
                            checked={
                              formData.customAnswers[q.id]?.value === "Other"
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                customAnswers: {
                                  ...formData.customAnswers,
                                  [q.id]: {
                                    ...formData.customAnswers[q.id],
                                    value: "Other",
                                  },
                                },
                              })
                            }
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all",
                              formData.customAnswers[q.id]?.value === "Other"
                                ? "border-blue-600 bg-white"
                                : "border-slate-300 group-hover:border-slate-400",
                            )}
                          />
                          {formData.customAnswers[q.id]?.value === "Other" && (
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="text-sm text-slate-700">Other</span>
                      </label>
                      {formData.customAnswers[q.id]?.value === "Other" && (
                        <input
                          type="text"
                          required
                          placeholder="Other"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          value={formData.customAnswers[q.id]?.otherValue || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customAnswers: {
                                ...formData.customAnswers,
                                [q.id]: {
                                  ...formData.customAnswers[q.id],
                                  otherValue: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : q.type === "checkbox" ? (
                <div className="space-y-3">
                  {q.options
                    ?.filter((opt) => opt.trim())
                    .map((opt, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={formData.customAnswers[
                              q.id
                            ]?.values?.includes(opt)}
                            onChange={(e) => {
                              const currentValues =
                                formData.customAnswers[q.id]?.values || [];
                              const newValues = e.target.checked
                                ? [...currentValues, opt]
                                : currentValues.filter(
                                    (v: string) => v !== opt,
                                  );
                              setFormData({
                                ...formData,
                                customAnswers: {
                                  ...formData.customAnswers,
                                  [q.id]: {
                                    ...formData.customAnswers[q.id],
                                    values: newValues,
                                  },
                                },
                              });
                            }}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                              formData.customAnswers[q.id]?.values?.includes(
                                opt,
                              )
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-300 group-hover:border-slate-400 bg-white",
                            )}
                          >
                            {formData.customAnswers[q.id]?.values?.includes(
                              opt,
                            ) && (
                              <div className="w-1.5 h-2.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    ))}
                  {q.includeOther && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={formData.customAnswers[q.id]?.includeOther}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                customAnswers: {
                                  ...formData.customAnswers,
                                  [q.id]: {
                                    ...formData.customAnswers[q.id],
                                    includeOther: e.target.checked,
                                  },
                                },
                              });
                            }}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                              formData.customAnswers[q.id]?.includeOther
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-300 group-hover:border-slate-400 bg-white",
                            )}
                          >
                            {formData.customAnswers[q.id]?.includeOther && (
                              <div className="w-1.5 h-2.5 border-b-2 border-r-2 border-white rotate-45 mb-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-slate-700">Other</span>
                      </label>
                      {formData.customAnswers[q.id]?.includeOther && (
                        <input
                          type="text"
                          required
                          placeholder="Other"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          value={formData.customAnswers[q.id]?.otherValue || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customAnswers: {
                                ...formData.customAnswers,
                                [q.id]: {
                                  ...formData.customAnswers[q.id],
                                  otherValue: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}

        <p className="text-xs text-gray-500 leading-relaxed">
          By proceeding, you confirm that you have read and agree to{" "}
          <a
            href="https://calendly.com/legal/invitee-terms-conditions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Calendly's Terms of Use
          </a>{" "}
          and{" "}
          <a
            href="https://calendly.com/legal/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Privacy Notice
          </a>
          .
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "bg-blue-600 text-white text-sm py-3 px-6 rounded-full transition-all shadow-lg shadow-blue-100",
            isSubmitting
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-blue-700",
          )}
        >
          {isSubmitting ? "Scheduling..." : "Schedule Event"}
        </button>
      </form>
    </div>
  );
};
