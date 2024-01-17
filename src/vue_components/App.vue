<template>
  <div>
    <div class="app_title">Amway KZ -> Мой склад</div>
    <template v-if="isLoading">
      <div class="app_loading">Загрузка...</div>
    </template>
    <template v-else-if="haveAmwayAuth == false">
      <div class="app_error">
        Вам необходимо авторизоваться на сайте
        <a href="https://kz.amway.com/" target="_blank">kz.amway.com</a>
      </div>
    </template>
    <template v-else>
      <div class="app">
        <div class="block_1">
          <div class="left">
            <input
              type="number"
              v-model="orderNumberValue"
              min="0"
              step="1"
              placeholder="Введите номер заказа"
              @focus="block_1_Error = ''"
            />
          </div>
          <div class="right"><a href="/" @click="getAmwayOrder">Запрос</a></div>
        </div>
        <div class="block_loading" v-if="isOrderLoading">Загрузка...</div>
        <div class="block_error" v-if="block_1_Error.length > 0">
          {{ block_1_Error }}
        </div>
        <div class="block_2" v-if="orderData !== undefined">
          <template v-for="(order, id) in orderDataForLoop" :key="id">
            <div :class="{ hide: order.use === false }">
              <div class="top">
                <div class="left">
                  <div class="i1">
                    <template v-if="id == 0">Заказ:</template
                    ><template v-else>Подзаказ:</template>
                    <span>{{ order.data.id }}</span>
                  </div>
                  <div class="i2">
                    № {{ order.data.customer.id }}
                    <span>{{ order.data.customer.name }}</span>
                  </div>
                </div>
                <template v-if="id != 0">
                  <div class="right">
                    <div class="title">Использовать:</div>
                    <div class="input">
                      <input type="checkbox" v-model="order.use" />
                    </div>
                  </div>
                </template>
              </div>
              <div class="goods">
                <template v-for="(good, gId) in order.data.goods" :key="gId">
                  <div>
                    <div class="title">
                      <span>{{ good.id }}</span> {{ good.name }}
                    </div>
                    <div class="inputs">
                      <div class="q">
                        <div class="title">Кол-во:</div>
                        <div class="input">
                          <input
                            type="number"
                            v-model="good.quantity"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>
                      <div class="p">
                        <div class="title">Цена:</div>
                        <div class="input">
                          <input
                            type="number"
                            v-model="good.price"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div class="s">
                        <div class="title">Сумма:</div>
                        <div class="value">
                          {{ coolNumber(safeMul(good.quantity, good.price)) }} ₸
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div class="sum">
                Итого:
                <span class="value">{{ coolNumber(order.data.sum) }}</span> ₸
                <br />
                Скидка:
                <span class="value">{{ coolNumber(order.data.discount) }}</span>
                ₸ <br />
                Итого со скидкой:
                <span class="value">{{ coolNumber(order.data.totalSum) }}</span>
                ₸
              </div>
            </div>
          </template>
        </div>
        <div class="block_3" v-if="orderData !== undefined">
          <div class="title">Отправка заказа в Мой склад</div>
          <div class="token">
            <div class="title">Токен доступа:</div>
            <div class="input">
              <input type="text" v-model="moySkladToken" />
            </div>
          </div>
          <div class="block_loading" v-if="isMoySkladLoading">Загрузка...</div>
          <div
            class="block_error"
            v-if="
              (typeof block_3_Error == 'string' && block_3_Error.length > 0) ||
              typeof block_3_Error == 'object'
            "
          >
            {{ block_3_Error }}
          </div>
          <div class="block_result" v-if="block_3_Result.length > 0">
            {{ block_3_Result }}
          </div>
          <div class="send">
            <a href="/" @click="sendToMoySklad">Отправить заказ</a>
          </div>
        </div>
        <div class="block_4" v-if="orderData !== undefined">
          <div class="title">Сводная таблица:</div>
          <table>
            <thead>
              <tr>
                <td>№</td>
                <td>ФИО</td>
                <td>Сумма заказа в ₸</td>
                <td>Скидка в ₸</td>
                <td>Сумма со скидкой в ₸</td>
              </tr>
            </thead>
            <tbody>
              <template v-for="(order, id) in orderDataForLoop" :key="id">
                <tr>
                  <td>{{ order.data.customer.id }}</td>
                  <td>{{ order.data.customer.name }}</td>
                  <td>{{ coolNumber(order.data.sum) }}</td>
                  <td>{{ coolNumber(order.data.discount) }}</td>
                  <td>{{ coolNumber(order.data.totalSum) }}</td>
                </tr>
              </template>
              <tr>
                <td>&nbsp;</td>
                <td><b>Всего</b></td>
                <td>{{ coolNumber(computedOrderSum) }}</td>
                <td>{{ coolNumber(computedDiscount) }}</td>
                <td>{{ coolNumber(computedOrderTotalSum) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import BigNumber from "bignumber.js";

import { defineComponent, ref } from "vue";

import { numberFormat } from "@/includes/funcs";
import amwayFactory, {
  orderData,
  orderDataItem,
  orderDataItemGood,
} from "@/includes/amwayFactory";
import moySkladFactory from "@/includes/moySkladFactory";
import { objectToString } from "@vue/shared";

export default defineComponent({
  data() {
    return {
      moySklad: new moySkladFactory(),
      isLoading: true,
      isOrderLoading: false,
      isBlock: false,
      block_1_Error: "",
      amwayCookies: [] as chrome.cookies.Cookie[],
      orderNumberValue: "",
      orderData: undefined as orderData | undefined,
      orderDataForLoop: [] as
        | { use: boolean; data: orderDataItem }[]
        | undefined,
      block_3_Error: "" as String | Error,
      block_3_Result: "",
      moySkladToken: "4faf280d35fe37d5529bd78b8c19b163babf38d9",
      isMoySkladLoading: false,
    };
  },
  setup() {
    return {};
  },
  methods: {
    getAmwayOrder(e: Event) {
      e.preventDefault();

      if (this.isBlock) {
        return;
      }

      this.block_1_Error = "";

      if (this.orderNumberValue.length == 0) {
        this.block_1_Error = "Ошибка: введите номер заказа!";
      } else {
        this.isOrderLoading = true;
        this.orderData = undefined;
        this.isBlock = true;

        amwayFactory
          .getOrderData(this.orderNumberValue)
          .then((result) => {
            this.isBlock = false;
            this.isOrderLoading = false;
            this.orderData = result;
          })
          .catch((e) => {
            this.isBlock = false;
            this.isOrderLoading = false;

            if (e.message == "Incorrect data") {
              this.block_1_Error =
                "Получены некорректные данные с сервера Amway!";
            } else {
              this.block_1_Error =
                "Ошибка при чтении заказа! Попробуйте зайти на сайт kz.amway.com и обновить страницу (для перезаписи сессии авторизации)!";
            }
          });
      }
    },

    countOrderSum(goods: orderDataItemGood[]): number {
      let result = new BigNumber(0);
      for (let item of goods) {
        result = result.plus(
          new BigNumber(item.quantity).multipliedBy(new BigNumber(item.price))
        );
      }
      return result.toNumber();
    },

    safeMul(a: number, b: number): number {
      return new BigNumber(a).multipliedBy(new BigNumber(b)).toNumber();
    },

    coolNumber(v: number | string): string {
      return numberFormat(v, v == parseInt(v.toString()) ? 0 : 2, ",", " ");
    },

    async sendToMoySklad(e: Event) {
      e.preventDefault();

      if (this.isBlock) {
        return;
      }

      this.block_3_Error = "";
      this.block_3_Result = "";

      if (this.moySkladToken.length == 0) {
        this.block_3_Error = "Токен доступа не указан!";
      }

      if (this.block_3_Error === "" && this.orderDataForUse !== undefined) {
        this.isMoySkladLoading = true;
        this.moySklad.setAccessToken(this.moySkladToken);

        try {
          let result = await this.moySklad.createOrder(this.orderDataForUse);
          this.block_3_Result = `Создано новых контрагентов: ${result.newCounterpartiesCount}, товаров: ${result.newGoodsCount}, заказов: ${result.newOrdersCount}. Не забудьте отредактировать объекты в системе!`;
        } catch (e: unknown) {
          this.block_3_Error = e as Error;
        } finally {
          this.isBlock = false;
          this.isMoySkladLoading = false;
        }
      }
    },
  },
  computed: {
    haveAmwayAuth(): boolean {
      let result = false;
      for (let cookie of this.amwayCookies) {
        if (cookie.name == "JSESSIONID" && cookie.value.length > 0) {
          result = true;
          break;
        }
      }
      return result;
    },

    computedOrderSum(): number {
      let result: number = 0;
      if (this.orderDataForLoop) {
        for (let item of this.orderDataForLoop) {
          result += item.data.sum;
        }
      }
      return result;
    },

    computedDiscount(): number {
      let result: number = 0;
      if (this.orderDataForLoop) {
        for (let item of this.orderDataForLoop) {
          result += item.data.discount;
        }
      }
      return result;
    },

    computedOrderTotalSum(): number {
      let result: number = 0;
      if (this.orderDataForLoop) {
        for (let item of this.orderDataForLoop) {
          result += item.data.totalSum;
        }
      }
      return result;
    },

    /*
    orderDataForLoop() : {use : boolean, data : orderDataItem}[] {
      if (this.orderData !== undefined)
      {
        let result : {use : boolean, data : orderDataItem}[] = [{use : true, data : this.orderData.order}];
        for (let item of this.orderData.subOrders)
        {
          result.push({use : true, data : item});
        }
        return result;
      }
      else {
        return [];
      }
    },
    */

    orderDataForUse(): orderData | undefined {
      if (this.orderData === undefined || this.orderDataForLoop === undefined) {
        return undefined;
      }

      let result: orderData = {
        order: this.orderData.order,
        subOrders: [],
        date: this.orderData.date,
      };

      for (let item of this.orderDataForLoop) {
        if (item.data.id != this.orderData.order.id && item.use) {
          result.subOrders.push(item.data);
        }
      }

      return result;
    },
  },
  watch: {
    orderData: function () {
      if (this.orderData !== undefined) {
        let result: { use: boolean; data: orderDataItem }[] = [
          { use: true, data: this.orderData.order },
        ];
        for (let item of this.orderData.subOrders) {
          result.push({ use: true, data: item });
        }
        this.orderDataForLoop = result;
      } else {
        this.orderDataForLoop = undefined;
      }
    },
  },
  mounted() {
    amwayFactory.getAmwayCookies().then((cookies) => {
      this.isLoading = false;
      this.amwayCookies = cookies;
    });
  },
});
</script>
