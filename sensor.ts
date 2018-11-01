//% color="purple" block="Sigfox"
namespace sigfox {
    // From sensor.h
    export const MAX_SENSOR_DATA_SIZE = 3
    export const MAX_SENSOR_NAME_SIZE = 3
    //% block
    export const BEGIN_SENSOR_NAME = "000"
    export const RESPONSE_SENSOR_NAME = "RES"
    export const SENSOR_NOT_READY = 255
    // Messages sent by Sensor Task containing sensor data
    // will be in this format.
    //% block
    export interface SensorMsg {
        // Msg_t super; //  Required for all cocoOS messages.
        name: string;   //  3-character name of sensor e.g. tmp, hmd. Includes terminating null.
        data: number[]; //  Array of float sensor data values returned by the sensor.
        count: uint8;        //  Number of float sensor data values returned by the sensor.
    }    
    //% block
    export function createSensorMsg(name: string, value?: number): Msg_t {
        //  Populate the msg fields as an empty message.
        let sensorMsg = <SensorMsg> {
            name: name,
            count: 0,  //  No data.
            data: [],
        }
        if (value !== null) {
            sensorMsg.count = 1;
            sensorMsg.data = [value];
        }
        const msg = <Msg_t> {
            sensorMsg: sensorMsg
        }
        return msg;
    }    
}