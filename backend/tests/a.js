// Remove console.log (per code quality rules)
// Add JSDoc for clarity
// Consistent formatting
/**
 * Finds the length of the longest substring without repeating characters.
 */
export function lengthOfLongestSubstring(s) {
    if (s.length <= 1)
        return s.length;
    const seen = new Set();
    let maxLength = 0;
    let start = 0;
    for (let end = 0; end < s.length; end++) {
        const char = s[end];
        while (seen.has(char)) {
            seen.delete(s[start]);
            start++;
        }
        seen.add(char);
        maxLength = Math.max(maxLength, end - start + 1);
    }
    return maxLength;
}
/**
 * Finds the median of two sorted arrays.
 */
export function findMedianSortedArrays(nums1, nums2) {
    const merged = nums1.concat(nums2).sort((a, b) => a - b);
    if (merged.length % 2 === 0) {
        const leftIdx = Math.floor(merged.length / 2) - 1;
        return (merged[leftIdx] + merged[leftIdx + 1]) / 2;
    }
    return merged[Math.floor(merged.length / 2)];
}
const mergeTwoLists = (list1, list2) => {
    if (!list1)
        return list2;
    if (!list2)
        return list1;
    if (list1.val < list2.val) {
        list1.next = mergeTwoLists(list1.next, list2);
        return list1;
    }
    else {
        list2.next = mergeTwoLists(list1, list2.next);
        return list2;
    }
};
const list1 = { val: 1, next: { val: 2, next: { val: 4, next: null } } };
const list2 = { val: 1, next: { val: 3, next: { val: 4, next: null } } };
console.log("mergeTwoLists(list1, list2);", mergeTwoLists(list1, list2));
console.log('aaa');
