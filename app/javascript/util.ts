export async function getJSON(dataPath) {
  const headers = {
    'Content-Type': 'application/json', 
    'X-CSRF-Token': document.querySelector('[name="csrf-token" ]').content
  };
  try {
    // return await Promise.all([
    //   fetch('/successes', headers).then(res => res.json()), 
    //   fetch('/companies/0/contributions', headers).then(res => res.json())
    // ]);
    return await fetch(`${dataPath}.json`, headers).then(res => res.json());
  } catch(err) {
    console.error(err);
  }
}

export function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function kebabToCamel(str) {
  return str.replace(/-./g, (char) => char[1].toUpperCase());
}

export function kebabize(str) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase());
}

export function copyToClipboard(str) {
  const onCopy = (e) => {
    e.clipboardData.setData("text/html", str);
    e.clipboardData.setData("text/plain", str);
    e.preventDefault();
  };
  document.addEventListener("copy", onCopy);
  document.execCommand("copy");
  document.removeEventListener("copy", onCopy);
}

export function distinctItems(items) {
  return items.filter((item, i, _items) => i === _items.indexOf(item));
}

export function distinctObjects(objects, attr) {
  return objects.filter((obj, i, _objects) => i === _objects.findIndex(_obj => _obj[attr] === obj[attr]));
}