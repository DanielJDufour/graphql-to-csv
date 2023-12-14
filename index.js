const { get, listPaths } = require("sendero");
const { convert } = require("@danieljdufour/json-to-csv");

const clone = obj => JSON.parse(JSON.stringify(obj));

function set_dot_path(obj, path, value, { sep = "." } = {}) {
  path = path.split(sep);
  for (let i = 0; i < path.length - 1; i++) {
    const it = path[i];
    if (!(it in obj)) obj[it] = {};
    obj = obj[it];
  }
  obj[path[path.length - 1]] = value;
}

async function generate({
  debug_level = false,
  fetch: _fetch,
  headers,
  max_requests = 100,
  ondata,
  pagination,
  query,
  query_subsequent,
  start,
  stream, // don't return results
  variables,
  url,
  cursor_get_path,
  cursor_set_path, // where to set cursor after you get it
  ...rest
}) {
  if (!_fetch && typeof fetch !== "function") {
    throw new Error(
      "[graphql-to-csv] it looks like fetch is undefined.  " +
        "If you are using NodeJS, try upgrading to a more recent version.  " +
        "If you are using a browser, try polyfilling with https://www.npmjs.com/package/whatwg-fetch.  " +
        "You can also pass in a fetch function, too, as a parameter."
    );
  }
  if (!_fetch) _fetch = fetch;

  let all_items = [];

  // clone variables
  if (!variables) variables = {};
  variables = clone(variables);

  let cursor;
  for (let i = 0; i < max_requests; i++) {
    if (debug_level >= 3) console.log("[graphql-to-csv] request number:", i);
    const body = {
      query: query_subsequent && i >= 1 ? query_subsequent : query,
      variables
    };
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    };
    const response = await _fetch(url, options);
    const response_data = await response.json();

    // for streaming requests
    if (typeof ondata === "function") {
      ondata({
        body,
        csv: convert(response_data, { ...rest }),
        data: response_data,
        req: { url, options }
      });
    }

    const response_items = start ? get(response_data, start) : response_data;
    if (debug_level >= 2) console.log("[graphql-to-csv] response_items.length:", response_items.length);
    if (response_items.length === 0) break;

    all_items = all_items.concat(response_items);

    if (!pagination) {
      if (debug_level >= 2) console.log("[graphql-to-csv] no pagination set, so breaking after the first request");
      break;
    }

    if (pagination === "cursor") {
      // find cursor
      if (!cursor_get_path) {
        const paths = listPaths(response_data);
        cursor_get_path = paths.find(function (path) {
          return path.indexOf("cursor") > -1;
        });
        if (!cursor_get_path) {
          throw new Error("[graphql-to-csv] unable to find cursor path");
        }
      }
      const newCursor = get(response_data, cursor_get_path)[0];
      if (newCursor === cursor) {
        throw new Error("[graphql-to-csv] got the same cursor again");
      }
      cursor = newCursor;

      // set cursor in variables
      if (!cursor_set_path) {
        throw new Error("[graphql-to-csv] missing cursor_set_path:", cursor_set_path);
      }
      set_dot_path(variables, cursor_set_path, cursor, { sep: "." });
      if (debug_level >= 2) console.log("[graphql-to-csv] updated variables to:\n" + JSON.stringify(variables, undefined, 2));
    }
  }

  // console.dir(all_items);
  const csv = convert(all_items, {
    ...rest,
    debug: false,
    quotes: true,
    start: "."
  });

  if (debug_level >= 3) {
    console.log("[graphql-to-csv] first 500 characters of the csv:", csv.substring(0, 500));
  }

  return { csv };
}

module.exports = {
  generate
};
