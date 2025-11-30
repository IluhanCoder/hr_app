import express from "express";
import PDFDocument from "pdfkit";
import { calculatePayroll } from "./payroll.controller.js";
import type { AuthRequest } from "../auth/auth.types.js";


export const generatePayslipPdf = async (req: AuthRequest, res: express.Response) => {


  const fakeRes: any = {
    json: (data: any) => data,
    status: () => fakeRes,
  };
  const payrollResult: any = await calculatePayroll(req, fakeRes);
  const payroll = payrollResult?.payroll;
  if (!payroll) return res.status(404).json({ success: false, message: "Payroll not found" });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="payslip_${payroll.user.id}_${payroll.period}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Платіжний листок', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Період: ${payroll.period}`);
  doc.text(`Працівник: ${payroll.user.name}`);
  doc.text(`Відділ: ${payroll.user.department || '-'} | Посада: ${payroll.user.jobTitle || '-'}`);
  doc.moveDown();
  doc.text(`Години: Звичайні: ${payroll.hours.regularHours}, Понаднормові: ${payroll.hours.overtimeHours}, Святкові: ${payroll.hours.holidayHours}`);
  doc.text(`Ставка: ${payroll.rates.hourlyRate} грн/год | Множник понаднормових: ${payroll.rates.overtimeMultiplier} | Множник святкових: ${payroll.rates.holidayMultiplier}`);
  doc.moveDown();
  doc.text(`Нарахування:`);
  doc.text(`  Звичайна оплата: ${payroll.components.regularPay} грн`);
  doc.text(`  Понаднормова оплата: ${payroll.components.overtimePay} грн`);
  doc.text(`  Святкова оплата: ${payroll.components.holidayPay} грн`);
  doc.text(`  Фіксований бонус: ${payroll.components.fixedBonus} грн`);
  doc.text(`  Бонус за ефективність: ${payroll.components.perfBonus} грн`);
  doc.moveDown();
  doc.text(`Всього нараховано (Gross): ${payroll.gross} грн`);
  doc.text(`Утримання:`);
  doc.text(`  ПДФО: ${(payroll.taxes.pit * 100).toFixed(1)}%`);
  doc.text(`  ЄСВ: ${(payroll.taxes.ssc * 100).toFixed(1)}%`);
  doc.text(`  Військовий збір: ${(payroll.taxes.mil * 100).toFixed(1)}%`);
  doc.text(`  Всього податків: ${payroll.taxes.total} грн`);
  doc.moveDown();
  doc.fontSize(14).text(`До виплати (Net): ${payroll.net} грн`, { align: 'right' });
  doc.end();
};
