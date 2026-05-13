class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(
  list1: ListNode | null,
  list2: ListNode | null
): ListNode | null {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (list1 && list2) {
    if (list1.val <= list2.val) {
      curr.next = list1;
      list1 = list1.next;
    } else {
      curr.next = list2;
      list2 = list2.next;
    }
    curr = curr.next;
  }

  curr.next = list1 ?? list2;

  return dummy.next;
}
const list1 = { val: 5, next: { val: 7, next: { val: 24, next: null } } };
const list2 = { val: 8, next: { val: 6 , next: { val: 14, next: null } } };
console.log("mergeTwoLists(list1, list2);", mergeTwoLists(list1, list2));