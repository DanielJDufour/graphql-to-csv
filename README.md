# graphql-to-csv
Export GraqhQL Data to CSV

## install
```sh
npm install graphql-to-csv
```

## usage
```js
import { generate } from "graphql-to-csv";

const results = await generate({
  // mapping of CSV columns to data paths
  columns: [
    { name: "title", path: "title" }, // name and path are the same
    {
      name: "data_centers", // name of the column in the CSV output
      path: "dataCenters.shortName" // path to the relevant data in the GraphQL Response
    },
  ],

  // optional, type of pagination
  // currently the only option is "cursor", but we will add more
  pagination: "cursor",

  // where to set the cursor in the variables after the response
  cursor_set_path: "params.cursor",

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

console.log(results.csv);
`"title","data_centers"
"'Latent reserves' within the Swiss NFI","WSL"
"(U-Th)/He ages from the Kukri Hills of southern Victoria Land","SYRACUSE/ES/TGIGRG"
"0.5 hour 1 M HCl extraction data for the Windmill Islands marine sediments","AU/AADC"
"1-100Hz ULF/ELF Electromagnetic Wave Observation at Syowa Station","TOHOKU/PAT"
"10 Days Synthesis of SPOT VEGETATION Images (VGT-S10)","VITO"
"10 m firn temperature data: LGB traverses 1990-95","AU/AADC"
"10 sec GPS ground tracking data","DE/GFZ/ISDC"
"10 year trend of levels of organochlorine pollutants in Antarctic seabirds","AU/AADC"
"10-HS Pfynwald","WSL"
"101.1 m long horizontal blue ice core collected from Scharffenbergbotnen, DML, Antarctica, in 2003/2004","U-LAPLAND/AC"
"12 Hourly Interpolated Surface Air Pressure from Buoys","ACADIS"
"12,000 year record of sea spray and minerogenic input from Emerald Lake, Macquarie Island","AU/AADC"
"12-Hourly Interpolated Surface Position from Buoys","ACADIS"
"12-Hourly Interpolated Surface Velocity from Buoys","ACADIS"
"14C of soil CO2 from IPY ITEX Cross Site Comparison","ACADIS"
"15 Minute Stream Flow Data: USGS (FIFE)","ORNL_DAAC"
"15 year Wilhelm II Land MSA and HOOH shallow ice core record from Mount Brown South (MBS)","AU/AADC"
"150 year MSA sea ice proxy record from Law Dome, Antarctica","AU/AADC"
"17O Excess from WAIS Divide, 0 to 25 ka BP, Version 1","USAP-DC"
"1982 Commodity Output by State and Input-Output Sector","USDA/ERS"`
```

### advanced usage
```js
  const { csv } = await generate({
    columns: [
      { name: "data_centers", path: "dataCenters.shortName" },
      { name: "concept_id", path: "conceptId" },
      { name: "short_name", path: "shortName" },
      { name: "title", path: "title" },
      { name: "time_end", path: "timeEnd" },
      { name: "time_start", path: "timeStart" }
    ],

    // if your cursor isn't name "cursor",
    // we won't be able to auto-detect it
    cursor_get_path: "collections.items.after",

    cursor_set_path: "params.cursor",

    // enable helpful console logging
    debug_level: 3,

    // total number of requests/pages
    max_requests: 5,
    pagination: "cursor",
    query: `query CollectionsQuery($params: CollectionsInput) { ...  }`,

    // sometimes your second and later requests are different than the first
    query_subsequent: `query NextCollectionsQuery...`,

    start: "data.collections.items",
    url: "https://graphql.earthdata.nasa.gov/api"
  });
```
