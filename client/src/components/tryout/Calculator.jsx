import React, { useState } from 'react';

const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleNumber = (num) => {
    if (display === '0' || isDone) {
      setDisplay(num);
      setIsDone(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
    setIsDone(false);
  };

  const calculate = () => {
    try {
      const result = eval(equation + display);
      setDisplay(String(Number(result.toFixed(8))));
      setEquation('');
      setIsDone(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setEquation('');
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  return (
    <div className="fixed top-24 right-6 z-[100] w-72 bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="bg-gray-800/5 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-600">calculate</span>
          <span className="text-sm font-bold text-gray-700">Calculator</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="p-4">
        <div className="bg-gray-900/5 rounded-2xl p-4 mb-4 text-right overflow-hidden border border-gray-100">
          <div className="text-xs text-gray-400 h-4 mb-1 truncate">{equation}</div>
          <div className="text-3xl font-bold text-gray-800 truncate">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={clearAll} className="col-span-2 p-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all">AC</button>
          <button onClick={clearEntry} className="p-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">CE</button>
          <button onClick={() => handleOperator('/')} className="p-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all">÷</button>
          
          {[7, 8, 9].map(n => (
            <button key={n} onClick={() => handleNumber(String(n))} className="p-3 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">{n}</button>
          ))}
          <button onClick={() => handleOperator('*')} className="p-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all">×</button>

          {[4, 5, 6].map(n => (
            <button key={n} onClick={() => handleNumber(String(n))} className="p-3 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">{n}</button>
          ))}
          <button onClick={() => handleOperator('-')} className="p-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all">−</button>

          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => handleNumber(String(n))} className="p-3 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">{n}</button>
          ))}
          <button onClick={() => handleOperator('+')} className="p-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all">+</button>

          <button onClick={() => handleNumber('0')} className="col-span-2 p-3 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">0</button>
          <button onClick={() => handleNumber('.')} className="p-3 bg-white border border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">.</button>
          <button onClick={calculate} className="p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">=</button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
