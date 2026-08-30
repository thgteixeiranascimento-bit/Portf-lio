/* ============================================================
   xlsx-bridge.js — ponte entre simuladores/*.html e o escritor de
   XLSX zero-dependência já construído para o simulador de PVM.
   ------------------------------------------------------------
   As páginas em simuladores/ usam scripts clássicos (sem
   type="module"), enquanto pvm-xlsx.js é um módulo ES. Em vez de
   duplicar ali dentro de core.js as ~300 linhas de ZIP/deflate/CRC32
   que já existem, testadas, neste arquivo — este módulo apenas
   importa a função de escrita e a expõe em window.writeXlsx, para
   que Viz.exportarPlanilha() (core.js, script clássico) possa
   chamá-la. Scripts type="module" rodam depois dos clássicos e antes
   de DOMContentLoaded, então window.writeXlsx já existe quando
   qualquer clique de usuário puder acontecer.
   ============================================================ */
import { writeXlsx } from "./pvm-xlsx.js";
window.writeXlsx = writeXlsx;
