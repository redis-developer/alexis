FROM redislabs/redisai:latest as redisai
FROM redislabs/redisearch:latest as redisearch
FROM redislabs/rejson:latest as rejson

ENV LD_LIBRARY_PATH /usr/lib/redis/modules

WORKDIR /data

COPY --from=redisai ${LD_LIBRARY_PATH}/redisai.so ${LD_LIBRARY_PATH}/
COPY --from=redisai ${LD_LIBRARY_PATH}/backends ${LD_LIBRARY_PATH}/backends
COPY --from=redisearch ${LD_LIBRARY_PATH}/redisearch.so ${LD_LIBRARY_PATH}/
