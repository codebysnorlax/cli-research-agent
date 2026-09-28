import {tavily} from "@tavily/core";
import {tool} from "langchain";
import * as z from "zod";


const tvly = tavily({apiKey:process.env.TAVILY_API_KEY});

export const webSearch = tool(
    async({query})=>{
        try {
            const data = await tvly.search(query , {maxResults:5});
            return JSON.stringify(data.results ?? []);
        } catch (err) {
            return `Error executing web_search: ${err.message}. Do not retry this tool with the same query.`;
        }
    },
    {
        name:"web_search",
        description:"Search the web for information",
        schema:z.object({query:z.string().describe("Search query")})
    }
);

export const visitPage = tool(
    async ({ url }) => {
      try {
        const data = await tvly.extract([url], {
          extractDepth: "advanced",
          format: "markdown",
        });
        if (data.failed?.length > 0) {
          return `Error: Failed to extract content from ${url}.`;
        }
        return data.results?.[0]?.rawContent ?? JSON.stringify(data);
      } catch (err) {
        return `Error executing visit_page: ${err.message}. Do not retry this tool with the same URL.`;
      }
    },
    {
      name: "visit_page",
      description: "Read and extract content from a URL.",
      schema: z.object({ url: z.string().describe("URL to read") }),
    },
);