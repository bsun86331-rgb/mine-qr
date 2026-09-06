/*
=========================================
矿山运输管理系统 V1.0
主程序
=========================================
*/


const App = {

    today:
        null,

    transportState:
        "WAIT_LOAD",

    tripCount:
        0,

    currentLoad:
        null,

    gps:
        null,


    init() {

        /*
        初始化当天数据
        */

        this.today =
            StorageManager
                .initializeDay();


        this.transportState =
            StorageManager
                .getTransportState();


        this.tripCount =
            StorageManager
                .getTripCount();


        this.currentLoad =
            StorageManager
                .getCurrentLoad();


        /*
        初始化页面
        */

        document
            .getElementById(
                "todayDate"
            )
            .textContent =
            this.today;


        document
            .getElementById(
                "driver"
            )
            .value =
            StorageManager
                .getDriver();


        document
            .getElementById(
                "truck"
            )
            .value =
            StorageManager
                .getTruck();


        /*
        输入自动保存
        */

        document
            .getElementById(
                "driver"
            )
            .addEventListener(
                "input",
                () => {

                    StorageManager
                        .setDriver(
                            this.getDriver()
                        );

                }
            );


        document
            .getElementById(
                "truck"
            )
            .addEventListener(
                "input",
                () => {

                    StorageManager
                        .setTruck(
                            this.getTruck()
                        );

                }
            );


        /*
        按钮
        */

        document
            .getElementById(
                "loadButton"
            )
            .addEventListener(
                "click",
                () => {
                    this.confirmLoad();
                }
            );


        document
            .getElementById(
                "unloadButton"
            )
            .addEventListener(
                "click",
                () => {
                    this.confirmUnload();
                }
            );


        this.updateCount();

        this.updateTransportStatus();

        this.renderRecords();

        this.updateButtons();


        this.showSystemMessage(
            "系统启动成功，正在获取GPS位置..."
        );


        /*
        启动持续定位
        */

        GPSManager.start(

            gpsState => {

                this.handleGps(
                    gpsState
                );

            },


            errorMessage => {

                document
                    .getElementById(
                        "gpsState"
                    )
                    .textContent =
                    "● GPS异常";


                this.showSystemMessage(
                    errorMessage
                );

            }

        );


        /*
        每分钟检查一次日期
        防止网页跨过00:00后没有刷新
        */

        setInterval(
            () => {

                this.checkNewDay();

            },
            60000
        );

    },


    getDriver() {

        return document
            .getElementById(
                "driver"
            )
            .value
            .trim();

    },


    getTruck() {

        return document
            .getElementById(
                "truck"
            )
            .value
            .trim();

    },


    checkNewDay() {

        const newToday =
            StorageManager
                .getToday();


        if (
            newToday ===
            this.today
        ) {

            return;

        }


        this.today =
            StorageManager
                .initializeDay();


        this.transportState =
            StorageManager
                .getTransportState();


        this.tripCount =
            StorageManager
                .getTripCount();


        this.currentLoad =
            null;


        document
            .getElementById(
                "todayDate"
            )
            .textContent =
            this.today;


        this.updateCount();

        this.updateTransportStatus();

        this.renderRecords();

        this.updateButtons();


        this.showSystemMessage(
            "已进入新的一天，今日运输统计已重新开始"
        );

    },


    handleGps(gps) {

        this.gps =
            gps;


        /*
        GPS显示
        */

        document
            .getElementById(
                "gpsState"
            )
            .textContent =
            "● GPS定位正常";


        document
            .getElementById(
                "latitude"
            )
            .textContent =
            gps.latitude
                .toFixed(6);


        document
            .getElementById(
                "longitude"
            )
            .textContent =
            gps.longitude
                .toFixed(6);


        document
            .getElementById(
                "accuracy"
            )
            .textContent =
            gps.accuracy
                .toFixed(1) +
            " 米";


        document
            .getElementById(
                "gpsTime"
            )
            .textContent =
            this.formatTime(
                new Date(
                    gps.timestamp
                )
            );


        /*
        当前区域
        */

        this.updateArea(
            gps
        );


        /*
        按钮状态
        */

        this.updateButtons();


        /*
        天气
        */

        this.updateWeather(
            gps.latitude,
            gps.longitude
        );

    },


    updateArea(gps) {

        const areaName =
            document
                .getElementById(
                    "areaName"
                );


        const areaDistance =
            document
                .getElementById(
                    "areaDistance"
                );


        if (
            gps.area === "LOAD"
        ) {

            areaName.textContent =
                MineAreas
                    .load
                    .name;


            areaDistance.textContent =

                "距离装载区中心 " +

                gps.loadDistance
                    .toFixed(1) +

                " 米";

        }


        else if (
            gps.area ===
            "UNLOAD"
        ) {

            areaName.textContent =
                MineAreas
                    .unload
                    .name;


            areaDistance.textContent =

                "距离卸载区中心 " +

                gps.unloadDistance
                    .toFixed(1) +

                " 米";

        }


        else {

            areaName.textContent =
                "运输途中";


            areaDistance.textContent =

                "距装载区 " +

                gps.loadDistance
                    .toFixed(0) +

                " 米 ｜ 距卸载区 " +

                gps.unloadDistance
                    .toFixed(0) +

                " 米";

        }

    },


    updateButtons() {

        const loadButton =
            document
                .getElementById(
                    "loadButton"
                );


        const unloadButton =
            document
                .getElementById(
                    "unloadButton"
                );


        const hint =
            document
                .getElementById(
                    "operationHint"
                );


        if (!this.gps) {

            loadButton.disabled =
                true;

            unloadButton.disabled =
                true;

            hint.textContent =
                "等待GPS定位";

            return;

        }


        /*
        等待装车
        */

        if (
            this.transportState ===
            "WAIT_LOAD"
        ) {

            unloadButton.disabled =
                true;


            if (
                this.gps.area ===
                "LOAD"
            ) {

                loadButton.disabled =
                    false;


                hint.textContent =
                    "已进入装载区，可以确认已装车";

            }


            else {

                loadButton.disabled =
                    true;


                hint.textContent =
                    "进入装载区后，“已装车”按钮自动启用";

            }

        }


        /*
        等待卸车
        */

        else {

            loadButton.disabled =
                true;


            if (
                this.gps.area ===
                "UNLOAD"
            ) {

                unloadButton.disabled =
                    false;


                hint.textContent =
                    "已进入卸载区，可以确认已卸车";

            }


            else {

                unloadButton.disabled =
                    true;


                hint.textContent =
                    "运输中，进入卸载区后可以确认卸车";

            }

        }

    },


    confirmLoad() {

        const driver =
            this.getDriver();


        const truck =
            this.getTruck();


        if (
            driver === "" ||
            truck === ""
        ) {

            this.showSystemMessage(
                "请先填写司机姓名和车辆编号"
            );

            return;

        }


        if (
            !this.gps ||
            this.gps.area !==
            "LOAD"
        ) {

            this.showSystemMessage(
                "当前不在装载区域，不能确认装车"
            );

            return;

        }


        if (
            this.transportState !==
            "WAIT_LOAD"
        ) {

            return;

        }


        const now =
            new Date();


        this.currentLoad = {

            time:
                now.toISOString(),

            latitude:
                this.gps.latitude,

            longitude:
                this.gps.longitude,

            accuracy:
                this.gps.accuracy,

            area:
                MineAreas
                    .load
                    .name

        };


        StorageManager
            .setCurrentLoad(
                this.currentLoad
            );


        this.transportState =
            "WAIT_UNLOAD";


        StorageManager
            .setTransportState(
                this.transportState
            );


        this.updateTransportStatus();

        this.updateButtons();


        this.showSystemMessage(

            "装车确认成功：" +

            this.formatTime(now) +

            "，请前往卸载区"

        );

    },


    confirmUnload() {

        if (
            !this.gps ||
            this.gps.area !==
            "UNLOAD"
        ) {

            this.showSystemMessage(
                "当前不在卸载区域，不能确认卸车"
            );

            return;

        }


        if (
            this.transportState !==
            "WAIT_UNLOAD"
        ) {

            this.showSystemMessage(
                "当前没有有效装车记录"
            );

            return;

        }


        if (!this.currentLoad) {

            this.showSystemMessage(
                "装车数据异常，本趟不能计数"
            );

            return;

        }


        const unloadDate =
            new Date();


        const loadDate =
            new Date(
                this.currentLoad.time
            );


        const durationSeconds =
            Math.max(
                0,
                Math.round(
                    (
                        unloadDate -
                        loadDate
                    ) / 1000
                )
            );


        this.tripCount++;


        const record = {

            id:
                Date.now(),

            date:
                this.today,

            tripNo:
                this.tripCount,

            driver:
                this.getDriver(),

            truck:
                this.getTruck(),

            loadArea:
                this.currentLoad.area,

            unloadArea:
                MineAreas
                    .unload
                    .name,

            loadTime:
                this.currentLoad.time,

            unloadTime:
                unloadDate
                    .toISOString(),

            loadLatitude:
                this.currentLoad
                    .latitude,

            loadLongitude:
                this.currentLoad
                    .longitude,

            unloadLatitude:
                this.gps.latitude,

            unloadLongitude:
                this.gps.longitude,

            loadAccuracy:
                this.currentLoad
                    .accuracy,

            unloadAccuracy:
                this.gps.accuracy,

            durationSeconds:
                durationSeconds

        };


        StorageManager
            .setTripCount(
                this.tripCount
            );


        StorageManager
            .addRecord(
                record
            );


        StorageManager
            .clearCurrentLoad();


        this.currentLoad =
            null;


        this.transportState =
            "WAIT_LOAD";


        StorageManager
            .setTransportState(
                this.transportState
            );


        this.updateCount();

        this.updateTransportStatus();

        this.updateButtons();

        this.renderRecords();

        this.showLatestTrip(
            record
        );


        this.showSystemMessage(

            "第 " +

            this.tripCount +

            " 趟完成，耗时 " +

            this.formatDuration(
                durationSeconds
            )

        );

    },


    updateCount() {

        document
            .getElementById(
                "tripCount"
            )
            .textContent =
            this.tripCount;

    },


    updateTransportStatus() {

        const status =
            document
                .getElementById(
                    "transportStatus"
                );


        const loadTimeStatus =
            document
                .getElementById(
                    "loadTimeStatus"
                );


        if (
            this.transportState ===
            "WAIT_LOAD"
        ) {

            status.textContent =
                "等待装车";


            loadTimeStatus.textContent =
                "进入装载区域后确认装车";

        }


        else {

            status.textContent =
                "已装车 · 运输中";


            if (this.currentLoad) {

                loadTimeStatus.textContent =

                    "装车时间：" +

                    this.formatDateTime(
                        this.currentLoad
                            .time
                    );

            }

        }

    },


    renderRecords() {

        const records =
            StorageManager
                .getRecords();


        const box =
            document
                .getElementById(
                    "tripRecords"
                );


        document
            .getElementById(
                "recordCount"
            )
            .textContent =

            records.length +
            "条";


        if (
            records.length === 0
        ) {

            box.innerHTML =

                '<div class="empty-record">' +

                '今日暂无运输记录' +

                '</div>';

            return;

        }


        let html = "";


        records.forEach(

            record => {

                html += `

                    <div class="trip-record">

                        <div class="trip-record-title">

                            第 ${record.tripNo} 趟

                        </div>

                        <div class="trip-record-info">

                            司机：
                            ${this.escapeHtml(record.driver)}

                            <br>

                            车辆：
                            ${this.escapeHtml(record.truck)}

                            <br>

                            装车：
                            ${this.formatDateTime(record.loadTime)}

                            <br>

                            卸车：
                            ${this.formatDateTime(record.unloadTime)}

                        </div>

                        <div class="trip-duration">

                            耗时：
                            ${this.formatDuration(record.durationSeconds)}

                        </div>

                    </div>

                `;

            }

        );


        box.innerHTML =
            html;

    },


    showLatestTrip(record) {

        const card =
            document
                .getElementById(
                    "latestTripCard"
                );


        const box =
            document
                .getElementById(
                    "latestTrip"
                );


        card.classList.remove(
            "hidden"
        );


        box.innerHTML =

            "<b>第 " +
            record.tripNo +
            " 趟完成</b>" +

            "<br>" +

            "装车：" +
            this.formatTime(
                new Date(
                    record.loadTime
                )
            ) +

            "<br>" +

            "卸车：" +
            this.formatTime(
                new Date(
                    record.unloadTime
                )
            ) +

            "<br>" +

            "耗时：" +
            this.formatDuration(
                record.durationSeconds
            );

    },


    async updateWeather(
        latitude,
        longitude
    ) {

        try {

            const weather =
                await WeatherManager
                    .update(
                        latitude,
                        longitude
                    );


            if (!weather) {
                return;
            }


            document
                .getElementById(
                    "weatherStatus"
                )
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "weatherContent"
                )
                .classList
                .remove(
                    "hidden"
                );


            document
                .getElementById(
                    "weatherText"
                )
                .textContent =
                weather.weatherText;


            document
                .getElementById(
                    "temperature"
                )
                .textContent =

                weather.temperature +
                "℃";


            document
                .getElementById(
                    "apparentTemperature"
                )
                .textContent =

                weather.apparentTemperature +
                "℃";


            document
                .getElementById(
                    "humidity"
                )
                .textContent =

                weather.humidity +
                "%";


            document
                .getElementById(
                    "windSpeed"
                )
                .textContent =

                weather.windSpeed +
                " km/h";


            document
                .getElementById(
                    "precipitation"
                )
                .textContent =

                weather.precipitation +
                " mm";


            document
                .getElementById(
                    "weatherUpdateTime"
                )
                .textContent =

                "天气更新时间：" +
                weather.time;

        }


        catch {

            document
                .getElementById(
                    "weatherStatus"
                )
                .textContent =
                "天气获取失败，请检查网络";

        }

    },


    showSystemMessage(message) {

        document
            .getElementById(
                "systemMessage"
            )
            .textContent =
            message;

    },


    formatTime(date) {

        return (

            String(
                date.getHours()
            ).padStart(2, "0")

            +

            ":"

            +

            String(
                date.getMinutes()
            ).padStart(2, "0")

            +

            ":"

            +

            String(
                date.getSeconds()
            ).padStart(2, "0")

        );

    },


    formatDateTime(value) {

        const date =
            new Date(value);


        return this.formatTime(
            date
        );

    },


    formatDuration(seconds) {

        if (
            seconds < 60
        ) {

            return (
                seconds +
                " 秒"
            );

        }


        const minutes =
            Math.floor(
                seconds / 60
            );


        const remainSeconds =
            seconds % 60;


        if (
            minutes < 60
        ) {

            return (

                minutes +
                " 分 " +

                remainSeconds +
                " 秒"

            );

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        const remainMinutes =
            minutes % 60;


        return (

            hours +
            " 小时 " +

            remainMinutes +
            " 分钟"

        );

    },


    escapeHtml(text) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            text || "";


        return div.innerHTML;

    }

};



/*
=========================================
启动系统
=========================================
*/


document.addEventListener(

    "DOMContentLoaded",

    () => {

        App.init();

    }

);