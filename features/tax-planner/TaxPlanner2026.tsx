
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Sparkles } from "../../components/icons/Sparkles";
import { ChevronRight } from "../../components/icons/ChevronRight";
import { Info } from "../../components/icons/Info";
import { fmt, parseNum } from "../../utils/formatting";


// In 2026, we assume a 5% VAT option (without deductions) is used.
// The base rate of 22% is shown for informational purposes but not used in calculations.
const VAT5 = 0.05;

export default function TaxPlanner2026() {
  // ---------- STEP 1: REVENUE ----------
  const [revTrainings, setRevTrainings] = useState("8000000");
  const [revCamps, setRevCamps] = useState("0");
  const [revRoyalty, setRevRoyalty] = useState("6000000");
  const [revGoods, setRevGoods] = useState("1000000");

  // ---------- STEP 2: EXPENSES ----------
  const [usnProfitExpenses, setUsnProfitExpenses] = useState("1200000");
  const [ausnProfitExpenses, setAusnProfitExpenses] = useState("1200000");

  // ---------- STEP 3: VAT & PSN THRESHOLD ----------
  const [prevYearRevenue, setPrevYearRevenue] = useState("15000000");
  const [vatThreshold, setVatThreshold] = useState("10000000");
  const [psnPatentCost, setPsnPatentCost] = useState("200000");

  // ---------- AGGREGATIONS ----------
  const totals = useMemo(() => {
    const trainings = parseNum(revTrainings);
    const camps = parseNum(revCamps);
    const royalty = parseNum(revRoyalty);
    const goods = parseNum(revGoods);
    const sport = trainings + camps; // VAT exempt
    const taxable = royalty + goods;  // Taxable base (for 5% VAT)
    const total = sport + taxable;
    return { trainings, camps, royalty, goods, sport, taxable, total };
  }, [revTrainings, revCamps, revRoyalty, revGoods]);

  const isVatPayer = parseNum(prevYearRevenue) > parseNum(vatThreshold);

  // ---------- SCENARIOS ----------
  // Scenario 1: PSN (sport) + USN 6% (main) + 5% VAT if applicable
  const usn6 = useMemo(() => {
    const usnTax = totals.taxable * 0.06;
    const vat = isVatPayer ? totals.taxable * VAT5 : 0;
    return {
      key: "usn6",
      label: "ПСН (спорт) + УСН 6% + НДС 5%",
      components: { 'Стоимость патента': parseNum(psnPatentCost), 'УСН 6%': usnTax, 'НДС 5%': vat },
      totalTax: parseNum(psnPatentCost) + usnTax + vat,
    };
  }, [totals, psnPatentCost, isVatPayer]);

  // Scenario 2: PSN (sport) + USN 15% (profit) + 5% VAT if applicable
  const usn15 = useMemo(() => {
    const base = Math.max(0, totals.taxable - parseNum(usnProfitExpenses));
    const usnTax = base * 0.15;
    const vat = isVatPayer ? totals.taxable * VAT5 : 0;
    return {
      key: "usn15",
      label: "ПСН (спорт) + УСН 15% + НДС 5%",
      components: { 'Стоимость патента': parseNum(psnPatentCost), 'УСН 15%': usnTax, 'НДС 5%': vat },
      totalTax: parseNum(psnPatentCost) + usnTax + vat,
    };
  }, [totals, psnPatentCost, usnProfitExpenses, isVatPayer]);

  // Scenario 3: All on AUSN 8% (income)
  const ausn8 = useMemo(() => {
    const tax = totals.total * 0.08;
    return { key: "ausn8", label: "Всё на АУСН 8% (доходы)", components: { 'АУСН 8%': tax }, totalTax: tax };
  }, [totals]);

  // Scenario 4: All on AUSN 20% (profit)
  const ausn20 = useMemo(() => {
    const base = Math.max(0, totals.total - parseNum(ausnProfitExpenses));
    const tax = base * 0.20;
    return { key: "ausn20", label: "Всё на АУСН 20% (прибыль)", components: { 'АУСН 20%': tax }, totalTax: tax };
  }, [totals, ausnProfitExpenses]);

  const scenarios = [usn6, usn15, ausn8, ausn20];
  const best = scenarios.reduce((a, b) => (a.totalTax < b.totalTax ? a : b));

  const chartData = scenarios.map((s) => ({ name: s.label, value: Math.round(s.totalTax) }));
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg">
          <p className="label font-semibold">{`${label}`}</p>
          <p className="intro text-indigo-600">{`Налог: ${fmt.format(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-2xl bg-indigo-100"><Sparkles className="h-6 w-6 text-indigo-600"/></div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Налоговый планировщик 2026</h1>
          </div>
          <p className="text-slate-600 max-w-3xl text-sm md:text-base">
            Шаги: (1) введите выручку, (2) укажите расходы, (3) подтвердите порог НДС и стоимость патента — и получите сравнение режимов. 
            <span className="block mt-2 text-slate-500">Подсказки: ПСН — только тренировки и лагеря (льгота по НДС). УСН — применяется к «голове»: royalty и товары. АУСН нельзя совмещать с ПСН в одном лице; сценарии АУСН показаны для сравнения.</span>
          </p>
        </motion.div>

        <StepCard step={1} title="Выручка за год" subtitle="Разделите спорт и облагаемую часть">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Тренировки (спорт, льгота НДС)" value={revTrainings} onChange={setRevTrainings} />
            <Field label="Лагеря (спорт, льгота НДС)" value={revCamps} onChange={setRevCamps} />
            <Field label="Royalty (облагаемая часть)" value={revRoyalty} onChange={setRevRoyalty} />
            <Field label="Товары (облагаемая часть)" value={revGoods} onChange={setRevGoods} />
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
            <BadgeRow left="Всего" right={fmt.format(totals.total)} />
            <BadgeRow left="Спорт (ПСН/льгота)" right={fmt.format(totals.sport)} />
            <BadgeRow left="Облагаемая база (голова)" right={fmt.format(totals.taxable)} />
          </div>
        </StepCard>

        <StepCard step={2} title="Расходы" subtitle="Нужны только для режимов «доходы-минус-расходы»">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Расходы по 'голове' (для УСН 15%)" value={usnProfitExpenses} onChange={setUsnProfitExpenses} />
            <Field label="Общие расходы (для АУСН 20%)" value={ausnProfitExpenses} onChange={setAusnProfitExpenses} />
          </div>
          <div className="mt-3 text-xs text-slate-500">Под «головой» понимаются royalty и товары. Если выбираете УСН 6%, этот блок можно игнорировать.</div>
        </StepCard>

        <StepCard step={3} title="Порог НДС и патент" subtitle="Если доход прошлого года выше порога — включается НДС 5% на облагаемую часть">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Доход прошлого года" value={prevYearRevenue} onChange={setPrevYearRevenue} />
            <Field label="Порог НДС (гипотеза)" value={vatThreshold} onChange={setVatThreshold} />
            <Field label="ПСН: годовая стоимость (спорт)" value={psnPatentCost} onChange={setPsnPatentCost} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <StatusPill ok={!isVatPayer} label={isVatPayer ? "Плательщик НДС в текущем году" : "Без НДС в текущем году"} />
            <span className="text-slate-500">НДС 5% применяется только к royalty+товарам.</span>
          </div>
        </StepCard>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <Card className="shadow-sm border-indigo-100/60">
            <CardHeader><CardTitle>Сравнение сценариев (налог за год)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-25} textAnchor="end" interval={0} height={90} />
                    <YAxis tickFormatter={(v) => `${(v as number / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }}/>
                    <Tooltip content={customTooltip} cursor={{ fill: 'rgba(199, 210, 254, 0.4)' }}/>
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-indigo-100/60">
            <CardHeader><CardTitle>Итог: лучший режим</CardTitle></CardHeader>
            <CardContent>
              <motion.div key={best.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl p-4 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100">
                <div className="text-slate-600 text-sm">Минимальная общая нагрузка</div>
                <div className="text-2xl font-semibold mt-1">{fmt.format(best.totalTax)}</div>
                <div className="mt-2 text-slate-700"><span className="font-medium">Сценарий:</span> {best.label}</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  {Object.entries(best.components).filter(([,v]) => (v as number) > 0).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-3 bg-white/70 border">
                      <div className="text-slate-500 text-xs">{k}</div>
                      <div className="font-medium">{fmt.format(v as number)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-3">
                  Пояснение: ПСН охватывает только спорт. УСН относится к "голове". НДС 5% (без вычетов) применяется к облагаемой базе при превышении порога.
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-xs text-slate-500 max-w-5xl space-y-2">
          <p>ℹ️ Справка: базовая ставка НДС оставлена как контекст, но в расчёты не включена. Модель считает только опцию НДС 5% (без вычетов) при превышении порога.</p>
          <p>⚠️ АУСН нельзя совмещать с ПСН в одном лице. Сценарии «ВСЁ на АУСН» — для ориентировочного сравнения целесообразности переноса всех потоков в единый контур.</p>
        </div>
      </div>
    </div>
  );
}

// Sub-components defined outside the main component to prevent re-renders
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}
const Field: React.FC<FieldProps> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" placeholder="0" className="bg-white/80" />
  </div>
);

interface StepCardProps {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
const StepCard: React.FC<StepCardProps> = ({ step, title, subtitle, children }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
    <Card className="mt-6 shadow-sm border-indigo-100/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 text-sm font-medium">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-bold">{step}</span>
              <span>Шаг {step}</span>
              <ChevronRight className="h-4 w-4 text-slate-400"/>
              <span className="text-slate-800 font-semibold">{title}</span>
            </div>
            {subtitle && <p className="text-slate-500 text-sm mt-2 ml-8">{subtitle}</p>}
          </div>
          <Info className="h-5 w-5 text-slate-400 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </motion.div>
);

interface BadgeRowProps {
  left: string;
  right: string;
}
const BadgeRow: React.FC<BadgeRowProps> = ({ left, right }) => (
  <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-slate-100/60 border border-slate-200/80">
    <span className="text-slate-600">{left}</span>
    <span className="font-medium text-slate-800">{right}</span>
  </div>
);

interface StatusPillProps {
  ok: boolean;
  label: string;
}
const StatusPill: React.FC<StatusPillProps> = ({ ok, label }) => (
  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>{label}</span>
);
