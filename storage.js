/*
=========================================
矿山运输管理系统 V1.0
本地数据管理
=========================================
*/


const StorageManager = {

    getToday() {

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    },


    initializeDay() {

        const today =
            this.getToday();

        const savedDate =
            localStorage.getItem(
                "recordDate"
            );


        if (savedDate !== today) {

            localStorage.setItem(
                "recordDate",
                today
            );

            localStorage.setItem(
                "tripCount",
                "0"
            );

            localStorage.setItem(
                "tripRecords",
                JSON.stringify([])
            );

            localStorage.setItem(
                "transportState",
                "WAIT_LOAD"
            );

            localStorage.removeItem(
                "currentLoad"
            );

        }

        return today;
    },


    getDriver() {

        return (
            localStorage.getItem(
                "driverName"
            ) || ""
        );

    },


    setDriver(name) {

        localStorage.setItem(
            "driverName",
            name
        );

    },


    getTruck() {

        return (
            localStorage.getItem(
                "truckNo"
            ) || ""
        );

    },


    setTruck(number) {

        localStorage.setItem(
            "truckNo",
            number
        );

    },


    getTripCount() {

        return Number(
            localStorage.getItem(
                "tripCount"
            )
        ) || 0;

    },


    setTripCount(count) {

        localStorage.setItem(
            "tripCount",
            String(count)
        );

    },


    getTransportState() {

        return (
            localStorage.getItem(
                "transportState"
            ) ||
            "WAIT_LOAD"
        );

    },


    setTransportState(state) {

        localStorage.setItem(
            "transportState",
            state
        );

    },


    getCurrentLoad() {

        const data =
            localStorage.getItem(
                "currentLoad"
            );

        if (!data) {
            return null;
        }

        try {

            return JSON.parse(data);

        } catch {

            return null;

        }

    },


    setCurrentLoad(data) {

        localStorage.setItem(
            "currentLoad",
            JSON.stringify(data)
        );

    },


    clearCurrentLoad() {

        localStorage.removeItem(
            "currentLoad"
        );

    },


    getRecords() {

        const data =
            localStorage.getItem(
                "tripRecords"
            );

        if (!data) {
            return [];
        }

        try {

            return JSON.parse(data);

        } catch {

            return [];

        }

    },


    saveRecords(records) {

        localStorage.setItem(
            "tripRecords",
            JSON.stringify(records)
        );

    },


    addRecord(record) {

        const records =
            this.getRecords();

        records.unshift(record);

        this.saveRecords(records);

        return records;

    }

};