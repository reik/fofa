    const nested = [1, [2, 3], [4, [5, [6, 7]]], 8];

    const flatten = (arr: unknown[]): unknown[] => {
        return arr.reduce<unknown[]>((acc, v) => {
            console.log("Array.isArray(v) ? flatten(v) : [v]",Array.isArray(v) ? flatten(v) : [v])
            acc.push(...(Array.isArray(v) ? flatten(v) : [v]));
            return acc;
        }, []);
    };

    console.log(flatten(nested)); // Output: [1, 2, 3, 4, 5, 6, 7, 8]

    const nums: number[] = [12, 1, 23, 4, 15];
console.log(nums.sort((left, right) => left - right)); // Output: [1, 4, 12, 15, 23]