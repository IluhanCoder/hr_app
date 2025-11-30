import React from "react";
import DatePicker, { DatePickerProps } from "react-datepicker";
import { uk } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

export const UkDatePicker: React.FC<DatePickerProps> = (props) => {
  return <DatePicker locale={uk} dateFormat="yyyy-MM-dd" {...props} />;
};

export const UkDateTimePicker: React.FC<DatePickerProps> = (props) => {
  return <DatePicker
    locale={uk}
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15}
    dateFormat="yyyy-MM-dd HH:mm"
    timeCaption="Час"
    {...props}
  />;
};
