function convert(s: string, numRows: number): string {

    const interval = (numRows + (numRows - 2))
    const result: string[][] = Array.from({ length: numRows });

    let col = 0;

    for (let i = 0; i < s.length; i++) {

        let c: number = 0;
        let r: number = 0;

        if (i % interval < numRows) {
            c = i % interval;
            r = col;

        } else {
            c = interval - (i % interval) - 1;
            r = col;
        }

        if (!result[c]) result[c] = [];
        result[c][r] = s[i]
        if (i % interval === interval - 1) col += 1;

    }

    console.log("result",result)

    return result.reduce((acc, row) => {
        console.log("row", row)
        acc += row.join('')
        return acc
    }, '')
}
console.log("convert('PAYPALISHIRING', 3);", convert('PAYPALISHIRING', 3));

let grid = Array.from({ length: 5 }, () => Array(4).fill(0));
console.log(grid);

const Obj = {...[1,2,3,4,5]};

let arrMap = new Map(Object.entries(Obj));

console.log(arrMap)

const testArr = [1,2,3,4,5,6,7,8,9];
console.log([...testArr.splice(4,2)]);
console.log(testArr);