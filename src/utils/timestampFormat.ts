import moment from "moment";

type IDateFormat = "DD:MM:YYYY" | "YYYY:MM:DD" | "DD/MM/YYYY" | "YYYY/MM/DD" | "DD-MM-YYYY" | "[YYYY,MM,DD]";

/**
 * 
 * @param {String} inputDate 
 * @param {String} format 
 * @returns { String } 
 * ----------------------------------------------------------------
 * The formatDate function takes an inputDate string and a format string as parameters and returns a formatted date string based on the specified format.
 * 
 * It supports various date formats such as "DD:MM:YYYY", "YYYY:MM:DD", "DD/MM/YYYY", "YYYY/MM/DD", "DD-MM-YYYY", and "[YYYY,MM,DD]".
 * 
 * The function attempts to convert the input date to the specified format. If the conversion is successful, it returns the formatted date. If the input date or the specified format is invalid, an error is thrown.
 * 
 * The provided examples demonstrate how the function can be used to convert input dates to different formats. Each example includes the input date, followed by the conversion to various formats, showing the formatted dates for each format.
 * 
 * `````````````````
 * Possible Examples:
 * `````````````````
 * 1. Input Date: 31/12/2022
 *      - Converted to DD:MM:YYYY: 31:12:2022
 *      - Converted to YYYY:MM:DD: 2022:12:31
 *      - Converted to DD/MM/YYYY: 31/12/2022
 *      - Converted to YYYY/MM/DD: 2022/12/31
 *      - Converted to DD-MM-YYYY: 31-12-2022
 *      - Converted to [YYYY,MM,DD]: [2022,12,31]
 * 2. Input Date: 2022:06:15
 *      - Converted to DD:MM:YYYY: 15:06:2022
 *      - Converted to YYYY:MM:DD: 2022:06:15
 *      - Converted to DD/MM/YYYY: 15/06/2022
 *      - Converted to YYYY/MM/DD: 2022/06/15
 *      - Converted to DD-MM-YYYY: 15-06-2022
 *      - Converted to [YYYY,MM,DD]: [2022,06,15]
 * 3. Input Date: 2023-01-25
 *      - Converted to DD:MM:YYYY: 25:01:2023
 *      - Converted to YYYY:MM:DD: 2023:01:25
 *      - Converted to DD/MM/YYYY: 25/01/2023
 *      - Converted to YYYY/MM/DD: 2023/01/25
 *      - Converted to DD-MM-YYYY: 25-01-2023
 *      - Converted to [YYYY,MM,DD]: [2023,01,25]
 * 4. Input Date: 09/08/2023
 *      - Converted to DD:MM:YYYY: 09:08:2023
 *      - Converted to YYYY:MM:DD: 2023:08:09
 *      - Converted to DD/MM/YYYY: 09/08/2023
 *      - Converted to YYYY/MM/DD: 2023/08/09
 *      - Converted to DD-MM-YYYY: 09-08-2023
 *      - Converted to [YYYY,MM,DD]: [2023,08,09]
 * 5. Input Date: 2024/03/12
 *      - Converted to DD:MM:YYYY: 12:03:2024
 *      - Converted to YYYY:MM:DD: 2024:03:12
 *      - Converted to DD/MM/YYYY: 12/03/2024
 *      - Converted to YYYY/MM/DD: 2024/03/12
 *      - Converted to DD-MM-YYYY: 12-03-2024
 *      - Converted to [YYYY,MM,DD]: [2024,03,12]
 * 6. Input Date: [2025,07,20]
 *      - Converted to DD:MM:YYYY: 20:07:2025
 *      - Converted to YYYY:MM:DD: 2025:07:20
 *      - Converted to DD/MM/YYYY: 20/07/2025
 *      - Converted to YYYY/MM/DD: 2025/07/20
 *      - Converted to DD-MM-YYYY: 20-07-2025
 *      - Converted to [YYYY,MM,DD]: [2025,07,20]
 * 
 * Overall, the formatDate function allows for easy conversion of dates between different formats, providing flexibility and versatility in date formatting operations.
 */
const dateFormat = (inputDate: string, format: IDateFormat): Promise<string> => {
    return new Promise((resolve, reject) => {
        const dateFormats = [
            "DD:MM:YYYY",
            "YYYY:MM:DD",
            "DD/MM/YYYY",
            "YYYY/MM/DD",
            "DD-MM-YYYY",
            "YYYY,MM,DD"
        ];

        if (!dateFormats.includes(format)) {
            reject(new Error("Invalid date format"));
        }

        try {
            const isValidDate = moment(inputDate, dateFormats, true).isValid();

            if (!isValidDate) {
                reject(new Error("Invalid date"));
            }

            const parsedDate = moment(inputDate, dateFormats, true);
            const currentFormat = parsedDate.format(format);

            if (currentFormat === inputDate) {
                resolve(inputDate);
            } else {
                const formattedDate = parsedDate.format(format);
                resolve(formattedDate);
            }
        } catch (error: any) {
            reject({
                message: error.message || "Invalid date format"
            });
        }
    });
};


export { dateFormat }