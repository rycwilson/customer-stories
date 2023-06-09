// toggle table stripes when alternating between row grouping and no row grouping
export function toggleRowStripes(table) {
  const dataRows = table.querySelectorAll('tr:not(.dtrg-group)');
  const hoverIn = (e) => e.currentTarget.style.backgroundColor = '#f5f5f5';
  // const hoverIn = (e) => e.currentTarget.style.backgroundColor = 'green';
  const hoverOut = (isEven, e) => {
    console.log(isEven, e)
    e.currentTarget.style.backgroundColor = isEven || removingStripes ? '#fff' : '#f9f9f9';
    // e.currentTarget.style.backgroundColor = isEven || removingStripes ? 'blue' : 'red';
  }
  table.classList.toggle('has-row-groups');
  table.querySelectorAll('.dtrg-group').forEach(tr => tr.classList.toggle('hidden'));
  // table.classList.add('grouped-data')
  dataRows.forEach((tr, i) => {
    tr.classList.remove('even', 'odd');

    // reset the hover behavior, lest the new background color override bootstrap
    // tr.removeEventListener('mouseenter', hoverIn);
    // tr.removeEventListener('mouseleave', hoverOut);
  });
  if (table.classList.contains('has-grow-groups')) {
    dataRows.forEach(tr => {
      // tr.style.backgroundColor = '#fff';
      // tr.addEventListener('mouseenter', hoverIn);
      // tr.addEventListener('mouseleave', hoverOut.bind(null, undefined));
    });
  } else {
    dataRows.forEach((tr, i) => {
      tr.classList.add(i % 2 === 0 ? 'even' : 'odd');
      // const isEven = i % 2 === 0;
      // tr.style.backgroundColor = isEven ? '#fff' : '#f9f9f9';
      // tr.style.backgroundColor = isEven ? 'blue' : 'red';
      // tr.addEventListener('mouseenter', hoverIn);
      // tr.addEventListener('mouseleave', hoverOut.bind(null, isEven));
    });
  }
}