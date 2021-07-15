# Alexis

Alexis is an app that uses RedisAI and RediSearch to retrieve information from a corpus (indexed library) in response to a query. Essentially, it's a text ranker that uses natural language processing combined with the BM25 ranking function to retrieve and answer questions in response to user queries.

We all are familiar with keyword search, also called keyword querying, where a user types a few query terms into a search box and gets back results containing representations of the indexed sources.

Alexis extends this basic keyword search by providing a more natural way of searching indexed sources. Furthermore, it aims to identify a span of text that directly answers the query instead of returning a list of documents (or extracts of documents).

## Screenshots

![Login](https://github.com/neurocode-io/alexis/raw/main/docs/login.png)
![How it works](https://github.com/neurocode-io/alexis/raw/main/docs/answer.png)

## Architecture

We break the challenge of finding the correct answer to a user query into two steps:

1. First we select the text that is likely to contain answers. We use RediSearch with the BM25 ranking function for this step.
2. We use a Transformer AI model loaded into RedisAI to identify the answer spans in the text.

Using RediSearch in the first step, we drastically reduce the search space, thus making the app's overall experience faster.


We use NodeJS with typescript in the backend and React with typescript in the frontend. Besides RedisAI and RediSearch we also use RedisJSON for our user model and an asynchronous worker implemented with Redis Streams.

We expose a web server with the express framework that has the following endpoints:

```
POST /v1/users
POST /v1/login
POST /v1/logout
GET /v1/me

POST /pdf  (pdfUpload)
POST /v1/query
```

Once a user registers and logs into the app. He can start adding documents to his indexed library.
A PDF upload writes an event to redis stream. A consumer from the consumer group picks up the event for async processing. The consumer processes the PDF, applies some cleaning and stores the PDF in a Redis hash that is indexed with RediSearch.

Afterward the user can send natural queries to the server and is not confined to basic keyword search such as "kubernetes deployments", "DDD root aggregate" etc.. but can query with more relevance such as "how do kubernetes deployments get updated?", "What is the role of a root aggregate in DDD"


## Flowchart

A general overview of what Alexis does can be represented as follows:

![general overview](https://github.com/neurocode-io/alexis/raw/main/docs/general-overview.png)

Now let's break down how the *Upload PDFs & Index PDF Content* and the *Answer Query* parts of the flowchart operate! 

### Upload PDFs & Index PDF Content

![upload and index](https://github.com/neurocode-io/alexis/raw/main/docs/upload-and-index.png)

### Answer Query

![answer query](https://github.com/neurocode-io/alexis/raw/main/docs/answer-query.png)



# How it works?

## 1. How the data is stored

1. The user data is stored in a RedisJSON:

   ```
   {
    firstName: string
    lastName: string
    email: string
    password: string
    pdfs: Array<{id: string, fileName: string}>
   }
   ```

2. A RediSearch index is created for each user with:
   
   ```
   FT.CREATE ax:idx:<userId> on HASH PREFIX 1 ax:pdfs:<userId> SCHEMA content TEXT PHONETIC dm:en
   ```

3. Once a user uploads a PDF we update his pdfs array with RedisJSON:
   ```
   JSON.ARRAPPEND ax:users:<userId> .pdfs {id: pdfId, fileName: <uploadedPdf>}
   ```


4. The file upload also triggers an event being written to the **ax:stream:pdf-processing** stream. The payload of the stream is
   
   ```
   {
     id: string,
     fileName: string
   }
   ```

4. A consumer within a consumer group picks this event off the stream and processess the file and writes the content in a hash:

   ```
   HSET ax:pdfs:<userId>.<paragraph> content <cleanedParagraphBlock> fileName <pdfFileName>
   ```

## 2. How the data is accessed

1. As mentioned earlier. We have an RediSearch index for each user that indexes this hash and provides lookup capabilities to find relevant content given a user query. We look up content with:

   ```
   FT.SEARCH ax:idx:<userId> '@content:<userQuery>' SCORER BM25 WITHSCORES LIMIT 0 4
   ```

2. The returned content from RediSearch we feed into the AI model that is being surfed with RedisAI!



## How to run it locally?

### Prerequisites
- Node - v12.x.x
- NPM - v6.x.x
- Docker and docker-compose

### Commands


1. npm install
2. npm run bootstrap 
3. npm start


The app: http://localhost:3000

Redis Insight: http://localhost:8001

## Test

```
npm test
```
