export const maskEmail = (email?: string) => {
  if (!email) return "";

  const [localPart, domain = ""] = email.split("@");
  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] || "*"}***`
      : `${localPart.slice(0, 2)}***${localPart.slice(-1)}`;

  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
};

export const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
};
