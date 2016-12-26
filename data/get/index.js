"use strict";

function dateFormat(dt,fmt) {
    if(!(dt instanceof Date)){
        console.warn("dt is not Date instance: "+dt);
        if(typeof(dt)=="string"){
            try{
                dt = new Date(dt);
            }catch(e){
                dt = new Date();
            }
        }else{
            dt = new Date();
        }
    }
    fmt = fmt || "yyyy-MM-dd";
    let o = {
        "M+": dt.getMonth() + 1, //月份
        "d+": dt.getDate(), //日
        "h+": dt.getHours(), //小时
        "m+": dt.getMinutes(), //分
        "s+": dt.getSeconds(), //秒
        "q+": Math.floor((dt.getMonth() + 3) / 3), //季度
        "S": dt.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (dt.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function getMockData(ctx,originData){

    let query = ctx.query || {};//url queryString

    originData.data += "" + dateFormat(new Date());

    return {
        // statusCode: 200,
        // headers:{},
        body: originData
    };
}

// exports
module.exports = getMockData;