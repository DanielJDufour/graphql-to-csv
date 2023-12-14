const fs = require("fs");
const test = require("flug");
const { generate } = require(".");

test("example", async ({ eq }) => {
  const results = await generate({
    // mapping of CSV columns to data paths
    columns: [
      { name: "title", path: "title" }, // name and path are the same
      {
        name: "data_centers", // name of the column in the CSV output
        path: "dataCenters.shortName" // path to the relevant data in the GraphQL Response
      }
    ],

    // optional, type of pagination
    // currently the only option is "cursor", but we will add more
    pagination: "cursor",

    // where to set the cursor in the variables after the response
    cursor_set_path: "params.cursor",

    max_requests: 1,

    // GraphQL query
    query: `query CollectionsQuery($params: CollectionsInput) {
      collections(params: $params) {
        cursor
        items {
          dataCenters
          timeEnd
          timeStart
          title
        }
      }
    }`,

    // where the array of row-like items starts in the GraphQL response
    start: "data.collections.items",

    // GraphQL API Endpoint
    url: "https://graphql.earthdata.nasa.gov/api"
  });
  // console.log(results.csv);
  eq(results.csv.split(/\r\n/g).slice(0, 2).join("\n"), '"title","data_centers"\n"\'Latent reserves\' within the Swiss NFI","WSL"');
});

test("nasa collections", async ({ eq }) => {
  const { csv } = await generate({
    columns: [
      { name: "data_centers", path: "dataCenters.shortName" },
      { name: "concept_id", path: "conceptId" },
      { name: "short_name", path: "shortName" },
      { name: "title", path: "title" },
      { name: "time_end", path: "timeEnd" },
      { name: "time_start", path: "timeStart" }
    ],
    cursor_set_path: "params.cursor",
    debug: true,
    max_requests: 5,
    pagination: "cursor",
    query: `query CollectionsQuery($params: CollectionsInput) {
      collections(params: $params) {
        cursor
        items {
          boxes
          conceptId
          cloudHosted
          dataCenters
          datasetId
          nativeId
          provider
          shortName
          timeEnd
          timeStart
          title
        }
      }
    }`,
    start: "data.collections.items",
    url: "https://graphql.earthdata.nasa.gov/api"
  });
  fs.writeFileSync("./test-output/nasa.csv", csv);
  eq(
    csv.substring(0, 500),
    `"data_centers","concept_id","short_name","title","time_end","time_start"\r\n"WSL","C2789815280-ENVIDAT","latent-reserves-in-the-swiss-nfi","'Latent reserves' within the Swiss NFI","2020-01-01T00:00:00.000Z","2020-01-01T00:00:00.000Z"\r\n"SYRACUSE/ES/TGIGRG","C1214587974-SCIOPS","KUKRI_He","(U-Th)/He ages from the Kukri Hills of southern Victoria Land","","1970-01-01T00:00:00.000Z"\r\n"AU/AADC","C1214305813-AU_AADC","ASAC_2201_HCL_0.5","0.5 hour 1 M HCl extraction data for the Windmill Islands marine s`
  );
});
