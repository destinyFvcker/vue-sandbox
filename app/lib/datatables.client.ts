import DataTablesCore from "datatables.net-select-dt";

import "datatables.net-buttons-dt";
import "datatables.net-buttons/js/buttons.colVis.mjs";
import "datatables.net-buttons/js/buttons.html5.mjs";
import "datatables.net-buttons/js/buttons.print.mjs";
import "datatables.net-colreorder-dt";
import "datatables.net-fixedcolumns-dt";
import "datatables.net-fixedheader-dt";
import "datatables.net-responsive-dt";
import "datatables.net-searchbuilder-dt";

/**
 * The single configured DataTables runtime used by the Vue adapter and demos.
 * Importing it from Select's styled package guarantees that render.select is
 * registered on this exact core instance, including in Vite development mode.
 */
export { DataTablesCore };

export const createSelectRenderer = () => DataTablesCore.render.select();
