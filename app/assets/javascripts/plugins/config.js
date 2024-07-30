function pluginConfigListeners () {

  const defaultMaxRows = 4;
  const defaultLightText = '#ffffff';
  const defaultDarkText = '#333333';
  // let debounceTimer;

  $(document)
    .on(
      'change', 
      `[name="plugin[gallery][max_rows]"], 
       [name="plugin[carousel][background]"],
       [name="plugin[tabbed_carousel][tab_color]"],
       [name="plugin[tabbed_carousel][text_color]"], 
       [name="plugin[tabbed_carousel][delay]"]`,
      updateSetting
    )
    .on('change', '[name="plugin[gallery][no_max_rows]"]', toggleMaxRows)
    .on('click', '.plugin-config .spinner button', pickNumber)
    .on('change', '[name="plugin[type]"], [name="plugin[content]"]', toggleRadioInput)
    .on('change', '[name="plugin[stories][]"]', updateStories)    
    .on('change', '[name="plugin[category]"], [name="plugin[product]"]', updateFilter)
    .on('click', '.plugin-config__code-actions a:not([disabled])', openDemo)
    .on('click', '.plugin-config button.copy', copyPluginCode)
    .on('keypress', '.plugin-config .spinner input', () => false);

  function toggleRadioInput(e) {
    const selection = e.target.value.replace('_', '-');
    const target = document.querySelector(`.plugin-config__${selection}`);
    Array.from(target.parentElement.children).forEach(child => {
      if (child === target) { 
        child.classList.remove('hidden'); 
      } else { 
        child.classList.add('hidden'); 
      }
    });
  }

  function updateSetting(e) {
    const code = document.querySelector('.plugin-config__code textarea');
    const setting = e.target.name.match(/max_rows|background|tab_color|text_color|delay/)[0].replace('_', '-');
    code.value = code.value.replace(
      new RegExp(
        `data-${setting}="${setting.match(/color/) ? '#' : ''}${setting.match(/max-rows|delay/) ? '\\d+' : '\\w+'}"`
      ),
      `data-${setting}="${e.target.value}"` 
    );
    if (setting === 'tab-color') {
      // clearTimeout(debounceTimer);
      // debounceTimer = setTimeout(() => checkContrast(e.target.value), 100);
      checkContrast(e.target.value)
    }
  }
  
  // https://stackoverflow.com/questions/11867545/
  // http://www.w3.org/TR/AERT#color-contrast
  function checkContrast(bgHex) {
    const bgRgb = hexToRgb(bgHex)
    const o = Math.round(
      ((parseInt(bgRgb.r) * 299) + (parseInt(bgRgb.g) * 587) + (parseInt(bgRgb.b) * 114)) / 1000
    );
    $('[name="plugin[tabbed_carousel][text_color]"]')
      .minicolors('value', { color: o > 125 ? defaultDarkText : defaultLightText })
  }

  function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    // const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    // hex = hex.replace(shorthandRegex, function(m, r, g, b) {
    //   return r + r + g + g + b + b;
    // });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : 
      null;
  };

  function toggleMaxRows(e) {
    const code = document.querySelector('.plugin-config__code textarea');
    const maxRowsEnabled = !e.target.checked;
    const maxRows = document.querySelector('[name="plugin[gallery][max_rows]');
    const spinnerButtons = document.querySelectorAll('.plugin-config__gallery .spinner button');
    maxRows.value = maxRowsEnabled ? defaultMaxRows.toString() : '';
    Array.from(spinnerButtons).forEach(btn => btn.disabled = !maxRowsEnabled);
    code.value = code.value.replace(
      maxRowsEnabled ? /><\/script>/ : /\sdata-max-rows="\d+"/,
      maxRowsEnabled ? `\xa0data-max-rows="${defaultMaxRows.toString()}"></script>` : ''
    );
  }

  function updateStories(e) {
    const code = document.querySelector('.plugin-config__code textarea');
    const isFirstSelection = !code.value.match(/data-stories/);
    const stories = Array.from(e.target.options).filter(opt => opt.selected).map(opt => parseInt(opt.value, 10))
    code.value = code.value
      .replace(/\xa0data-(category|product)="(\w|-)*"/, '')
      .replace(
        isFirstSelection ? /><\/script>/ : /\xa0data-stories="\[((\d+(,)?)+)?\]"/,
        stories.length ? 
          `\xa0data-stories="${JSON.stringify(stories)}"` + (isFirstSelection ? '></script>' : '') :
          ''
      );
    $(`[name="plugin[category]"], [name="plugin[product]"]`).val('').trigger('change.select2');
  }

  function updateFilter(e) {
    const code = document.querySelector('.plugin-config__code textarea');
    const filter = e.target.name.match(/category|product/)[0];
    const otherFilter = filter === 'category' ? 'product' : 'category';
    const isFirstSelection = !code.value.match(new RegExp(`data-${filter}`));
    const selectedOption = e.target.querySelector('option:checked'); 
    const wasCleared = !selectedOption.value;
    const slug = selectedOption.value && selectedOption.dataset.slug;
    code.value = code.value
      .replace(new RegExp(`\\sdata-${otherFilter}="(\\w|-)*"`), '')
      .replace(/\xa0data-stories="\[((\d+(,)?)+)?\]"/, '')
      .replace(
        isFirstSelection ? /><\/script>/ : new RegExp(`\\sdata-${filter}="(\\w|-)*"`),
        wasCleared ? '' : `\xa0data-${filter}="${slug}"` + (isFirstSelection ? '></script>' : '')
      );
    $(`[name="plugin[stories][]"]`).val([]).trigger('change.select2');
    $(`[name="plugin[${otherFilter}]"]`).val('').trigger('change.select2');
  }

  function openDemo(e) {
    const link = e.currentTarget;
    const params = new FormData(document.pluginConfig);
    const inactiveParams = [];
    for (const [param, value] of params) {
      const isOtherContent = param.match(/stories|category|product/) && !param.includes(params.get('plugin[content]'));
      const isOtherType = param.match(/gallery|carousel|tabbed_carousel/) && !param.includes(params.get('plugin[type]'));
      if (isOtherContent || isOtherType) inactiveParams.push(param);
    }
    inactiveParams.forEach(param => params.delete(param));
    params.delete('plugin[content]');
    $(link)
      .attr('href', `/plugins/demo?${new URLSearchParams(params).toString()}`)
      .popupWindow(e, window.innerWidth * 0.85, window.innerHeight * 0.85);
  }
    
  // https://codepen.io/Thomas-Lebeau/pen/nRqWvp
  function pickNumber(e) {
    const btn = e.currentTarget;
    const input = btn.closest('.spinner').children[0];
    const shouldIncrement = btn.classList.contains('btn--inc');
    const step = shouldIncrement ? 1 : -1;
    const newVal = parseInt(input.value, 10) + step;
    input.value = newVal;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (newVal === parseInt(input.min, 10) || newVal === parseInt(input.max, 10)) {
      btn.disabled = true;
    } else {
      btn.disabled = false;
      (btn.previousElementSibling || btn.nextElementSibling).disabled = false;
    }
  }
  
  function copyPluginCode(e) {
    const btn = e.currentTarget;
    const temp = document.createElement('textarea');
    const toggleBtn = (didCopy) => {
      const children = document.querySelector('.plugin-config button.copy').children;
      Array.from(children).forEach(child => child.classList.toggle('hidden'));
      btn.disabled = didCopy;
      btn.style.cursor = didCopy ? 'default' : 'pointer';
    };
    temp.innerText = document.querySelector('.plugin-config textarea[readonly]').textContent;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
    toggleBtn(true);
    setTimeout(() => toggleBtn(false), 1500); 
  }
}