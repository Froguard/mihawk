/**
 *
 * @author hzwangfei3
 * @date   2016/10/17.
 */
function getMockData(ctx,originData){

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: originData
    };
}

// exports
module.exports = getMockData;