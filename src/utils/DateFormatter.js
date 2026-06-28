import dayjs from "dayjs";

export const formatDate = (date, format = "ddd, MMM D, YYYY h:mm A") => {
  if (!date) return "—";
  return dayjs(date).format(format);
};
