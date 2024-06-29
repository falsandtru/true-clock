import { max, min } from 'spica/alias';
import { List } from 'spica/list';

class Node<K, V> implements List.Node {
  constructor(
    public key: K,
    public value: V,
    public partition: 1 | -1 | 2 | -2,
  ) {
  }
  public next?: this = undefined;
  public prev?: this = undefined;
}

export class ARC<K, V> {
  constructor(
    private capacity: number,
  ) {
  }
  private readonly dict = new Map<K, Node<K, V>>();
  private readonly T1 = new List<Node<K, V>>();
  private readonly B1 = new List<Node<K, V>>();
  private readonly T2 = new List<Node<K, V>>();
  private readonly B2 = new List<Node<K, V>>();
  //private readonly L1 = new List<Node<K, V>>();
  //private readonly L2 = new List<Node<K, V>>();
  //private T1 = 0;
  //private T2 = 0;
  private p = 0;
  private add_T1(key: K, value: V): void {
    this.T1.unshift(new Node(key, value, 1));
  }
  private add_T2(node: Node<K, V>): void {
    node.partition = 2;
    this.T2.unshift(node);
  }
  private add_B1(node: Node<K, V>): void {
    assert(node.partition === 1);
    node.partition = -1;
    node.value = undefined as any;
    this.B1.unshift(node);
  }
  private add_B2(node: Node<K, V>): void {
    assert(node.partition === 2);
    node.partition = -2;
    node.value = undefined as any;
    this.B2.unshift(node);
  }
  private del_T1(node: Node<K, V>): void {
    assert(node.next);
    this.T1.delete(node);
  }
  private del_T2(node: Node<K, V>): void {
    assert(node.next);
    this.T2.delete(node);
  }
  private del_B1(node: Node<K, V>): void {
    assert(node.next);
    this.B1.delete(node);
  }
  private del_B2(node: Node<K, V>): void {
    assert(node.next);
    this.B2.delete(node);
  }
  private del_T1_LRU(): Node<K, V> {
    assert(this.T1.length);
    return this.T1.pop()!;
  }
  private del_T2_LRU(): Node<K, V> {
    assert(this.T2.length);
    return this.T2.pop()!;
  }
  private del_B1_LRU(): Node<K, V> {
    assert(this.B1.length);
    return this.B1.pop()!;
  }
  private del_B2_LRU(): Node<K, V> {
    assert(this.B2.length);
    return this.B2.pop()!;
  }
  private replace(inB2: boolean): void {
    assert(this.p === this.p >>> 0);
    if (this.T1.length !== 0 && (this.T1.length > this.p || (inB2 && this.T1.length === this.p))) {
      this.add_B1(this.del_T1_LRU());
    } else {
      this.add_B2(this.del_T2_LRU());
    }
  }
  private evict(): void {
    if (this.T1.length + this.B1.length === this.capacity) {
      if (this.T1.length === this.capacity) {
        this.dict.delete(this.del_T1_LRU().key);
      } else {
        this.dict.delete(this.del_B1_LRU().key);
        this.replace(false);
      }
    }
    else if (this.length === this.capacity) {
      this.B1.length + this.B2.length === this.capacity && this.dict.delete(this.del_B2_LRU().key);
      this.replace(false);
    }
  }
  public get length(): number {
    return this.T1.length + this.T2.length;
  }
  public set(key: K, value: V): this {
    const node = this.dict.get(key);
    switch (node?.partition) {
      case 1:
      case 2:
        node.value = value;
        break;
      case -1: {
        const delta = this.B2.length > this.B1.length ? this.B2.length / this.B1.length | 0 : 1;
        this.p = min(this.p + delta, this.capacity);
        assert(this.p === this.p >>> 0);
        this.replace(false);
        this.del_B1(node);
        this.add_T2(node);
        node.value = value;
        break;
      }
      case -2: {
        const delta = this.B1.length > this.B2.length ? this.B1.length / this.B2.length | 0 : 1;
        this.p = max(this.p - delta, 0);
        assert(this.p === this.p >>> 0);
        this.replace(true);
        this.del_B2(node);
        this.add_T2(node);
        node.value = value;
        break;
      }
      default:
        this.length === this.capacity && this.evict();
        this.add_T1(key, value);
        this.dict.set(key, this.T1.head!);
        break;
    }
    return this;
  }
  public get(key: K): V | undefined {
    const node = this.dict.get(key);
    switch (node?.partition) {
      case 1:
        this.del_T1(node);
        this.add_T2(node);
        return node.value;
      case 2:
        this.del_T2(node);
        this.add_T2(node);
        return node.value;
      default:
        return;
    }
  }
  public clear() {
    this.T1.clear();
    this.B1.clear();
    this.T2.clear();
    this.B2.clear();
    this.p = 0;
  }
}
