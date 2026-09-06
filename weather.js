/*
=========================================
矿山运输管理系统 V1.0
当前位置天气
=========================================
*/


const WeatherManager = {

    lastUpdate:
        0,

    interval:
        10 * 60 * 1000,


    async update(
        latitude,
        longitude,
        force = false
    ) {

        if (
            latitude === null ||
            longitude === null
        ) {

            return null;

        }


        const now =
            Date.now();


        if (
            !force &&
            now - this.lastUpdate <
            this.interval
        ) {

            return null;

        }


        try {

            const url =

                "https://api.open-meteo.com/v1/forecast"

                +

                "?latitude=" +
                encodeURIComponent(
                    latitude
                )

                +

                "&longitude=" +
                encodeURIComponent(
                    longitude
                )

                +

                "&current=" +

                "temperature_2m," +

                "apparent_temperature," +

                "relative_humidity_2m," +

                "precipitation," +

                "weather_code," +

                "wind_speed_10m"

                +

                "&timezone=auto";


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "天气服务器返回错误"
                );

            }


            const data =
                await response.json();


            if (!data.current) {

                throw new Error(
                    "没有天气数据"
                );

            }


            this.lastUpdate =
                now;


            return {

                temperature:
                    data.current
                        .temperature_2m,

                apparentTemperature:
                    data.current
                        .apparent_temperature,

                humidity:
                    data.current
                        .relative_humidity_2m,

                precipitation:
                    data.current
                        .precipitation,

                windSpeed:
                    data.current
                        .wind_speed_10m,

                weatherCode:
                    data.current
                        .weather_code,

                weatherText:
                    this.getWeatherText(
                        data.current
                            .weather_code
                    ),

                time:
                    data.current.time

            };

        }


        catch (error) {

            console.error(
                "天气获取失败：",
                error
            );

            throw error;

        }

    },


    getWeatherText(code) {

        if (code === 0) {
            return "晴";
        }


        if (
            code === 1 ||
            code === 2
        ) {
            return "少云";
        }


        if (code === 3) {
            return "阴天";
        }


        if (
            code === 45 ||
            code === 48
        ) {
            return "有雾";
        }


        if (
            code >= 51 &&
            code <= 55
        ) {
            return "毛毛雨";
        }


        if (
            code === 56 ||
            code === 57
        ) {
            return "冻毛毛雨";
        }


        if (
            code >= 61 &&
            code <= 65
        ) {
            return "下雨";
        }


        if (
            code === 66 ||
            code === 67
        ) {
            return "冻雨";
        }


        if (
            code >= 71 &&
            code <= 75
        ) {
            return "下雪";
        }


        if (code === 77) {
            return "雪粒";
        }


        if (
            code >= 80 &&
            code <= 82
        ) {
            return "阵雨";
        }


        if (
            code === 85 ||
            code === 86
        ) {
            return "阵雪";
        }


        if (code === 95) {
            return "雷暴";
        }


        if (
            code === 96 ||
            code === 99
        ) {
            return "雷暴伴冰雹";
        }


        return "未知天气";

    }

};