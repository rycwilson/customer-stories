// toggle table stripes when alternating between row grouping and no row grouping
// the Datatables table-striped class does not take row groups into account, hence this approach
export function toggleRowGroups(table) {
  const removingGroups = table.classList.contains('has-row-groups');
  const dataRows = table.querySelectorAll('tbody > tr:not(.dtrg-group)');
  table.classList.toggle('has-row-groups');
  dataRows.forEach(tr => tr.classList.remove('even', 'odd'));
  if (removingGroups) dataRows.forEach((tr, i) => tr.classList.add(i % 2 === 0 ? 'even' : 'odd'));
  $(table).DataTable().draw();
}