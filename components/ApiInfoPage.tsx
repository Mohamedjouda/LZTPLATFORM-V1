import React from 'react';

const apiDescription = `## [Forum API](https://lolzteam.readme.io/)

## [Telegram chat](https://t.me/lztmarket_api)

## Free API Client packages

* [Node.js](https://github.com/NztForum/node-lzt) - [Documentation](https://github.com/NztForum/node-lzt/blob/master/docs-ru.md)
* [Python](https://github.com/AS7RIDENIED/LOLZTEAM) - [Documentation](https://github.com/AS7RIDENIED/LOLZTEAM/blob/main/Documentation/Market.md)
* [C#](https://github.com/fanidamn/LolzMarketAPI) - [Documentation](https://github.com/fanidamn/LolzMarketAPI/blob/main/README.md)

## About Market API

Market API almost completely repeats WEB requests. Query parameters match. The only differences are the presence of PUT and DELETE methods.[https://lzt.market/113509951/tag/add?tag_id=10](https://lzt.market/113509951/tag/add?tag_id=10)
For example, a request to reserve an account on the WEB looks like this: \`lzt.market/market/{item_id}/tag/add?tag_id={tag_id}\`, and an API request looks like this: \`api.lzt.market/{item_id}/tag/add?tag_id={tag_id}\`.

## Rate limit

120 requests per minute (0.5 seconds delay between requests)
If you exceed the limit, you will receive an error message and response code 429.

## Search limit

20 requests per minute for only **Category Search** methods (3 seconds delay between per request).
If you exceed the limit, you will receive an error message and response code 429.

## Authorization & Token configuration

For using this API you need to create API Client and get Access Token with **market** scope.

You can pass the token as a query parameter or in the request headers

* Query parameter: **oauth_token=*token***
* Header: **Authorization**: "**Bearer *token***"

## Content-Type

API always returns the response as application/json (With few exceptions).
You should send requests to API with application/json or application/x-www-form-urlencoded content type.

## Is for free access?

To use the market api, you need to have 200 sympathies, or you can purchase monthly subscription [here](https://zelenka.guru/account/upgrades).

You can import the API into Postman using [this](https://raw.githubusercontent.com/AS7RIDENIED/LOLZTEAM/main/Official%20Documentation/market.json) file.`;

const ApiInfoPage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Lolzteam Market API Info</h1>
      <div 
        className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: apiDescription.replace(/## (.*?)\n/g, '<h2 class="text-xl font-semibold mt-6 mb-2">$1</h2>').replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-1">$1</h3>').replace(/\* \[(.*?)\]\((.*?)\)/g, '<li><a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:underline">$1</a></li>').replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 rounded-md px-1.5 py-0.5 text-sm font-mono">$1</code>') }}
      />
    </div>
  );
};
export default ApiInfoPage;
