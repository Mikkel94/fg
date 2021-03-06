import { IOrder } from 'app/model';
import { Component, OnInit } from '@angular/core';
import { StoreService } from 'app/services';

@Component({
  selector: 'fg-old-orders',
  templateUrl: '../all-orders.component.html',
  styleUrls: ['../orders.component.scss']
})
export class OldOrdersComponent implements OnInit {
  orders: IOrder[];

  constructor(
    public store: StoreService
  ) { }

  ngOnInit() {
    this.store.getOrdersAction('old').subscribe(o => this.orders = o);
  }

  toggleOrderCompleted(order: IOrder) {
    const tmp_order = Object.assign({}, order);
    tmp_order.order_completed = !tmp_order.order_completed;
    this.store.toggleOrderCompletedAction(tmp_order, 'old');
  }
}
