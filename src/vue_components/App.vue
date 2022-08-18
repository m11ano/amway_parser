<template>
    <div>
        <div class="app_title">Amway KZ -> Мой склад</div>
        <template v-if="isLoading">
          <div class="app_loading">Загрузка...</div>
        </template>
        <template v-else-if="haveAmwayAuth == false">
          <div class="app_error">Вам необходимо авторизоваться на сайте <a href="https://kz.amway.com/" target="_blank">kz.amway.com</a></div>
        </template>
        <template v-else>
          <div class="app">
            <div class="block_1">
              <div class="left">
                <input type="number" v-model="orderNumberValue" min="0" step="1" placeholder="Введите номер заказа" @focus="block_1_Error = '';"/>
              </div>
              <div class="right"><a href="/" @click="getAmwayOrder">Запрос</a></div>
            </div>
            <div class="block_loading" v-if="isOrderLoading">Загрузка...</div>
            <div class="block_error" v-if="block_1_Error.length > 0">{{block_1_Error}}</div>
            <div class="block_2" v-if="orderData !== undefined">
              <template v-for="(order, id) in orderDataForLoop" :key="id">
                <div>
                  <div class="i1"><template v-if="id == 0">Заказ:</template><template v-else>Подзаказ:</template> <span>{{order.id}}</span></div>
                  <div class="i2">№ {{order.customer.id}} <span>{{order.customer.name}}</span></div>
                  <div class="goods">
                    <template v-for="(good, gId) in order.goods" :key="gId">
                      <div>
                        <div class="title"><span>{{good.id}}</span> {{good.name}}</div>
                        <div class="inputs">
                          <div class="q">
                            <div class="title">Кол-во:</div>
                            <div class="input"><input type="number" v-model="good.quantity" min="0" step="1" /></div>
                          </div>
                          <div class="p">
                            <div class="title">Цена:</div>
                            <div class="input"><input type="number" v-model="good.price" min="0" step="0.01" /></div>
                          </div>
                          <div class="s">
                            <div class="title">Сумма:</div>
                            <div class="value">{{coolNumber(safeMul(good.quantity, good.price))}} ₸</div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                  <div class="sum">
                    Итого: <span class="value">{{coolNumber(countOrderSum(order.goods))}}</span> ₸
                  </div>
                </div>
              </template>
            </div>
            <div class="block_3" v-if="orderData !== undefined">
              <div class="title">Отправка заказа в Мой склад</div>
              <div class="token">
                <div class="title">Токен доступа:</div>
                <div class="input"><input type="text" v-model="moySkladToken" /></div>
              </div>
              <div class="send"><a href="/" @click="sendToMoySklad">Отправить заказ</a></div>
            </div>
            <div class="block_loading" v-if="isMoySkladLoading">Загрузка...</div>
            <div class="block_error" v-if="block_3_Error.length > 0">{{block_3_Error}}</div>
          </div>
        </template>
    </div>
</template>

<script lang="ts">

import BigNumber from "bignumber.js";

import { defineComponent, ref } from 'vue';

import { numberFormat } from '@/includes/funcs';
import amwayFactory, {orderData, orderDataItem, orderDataItemGood} from '@/includes/amwayFactory';


export default defineComponent({
  data() {
    return {
      isLoading : true,
      isOrderLoading : false,
      isBlock : false,
      block_1_Error : '',
      amwayCookies : [] as chrome.cookies.Cookie[],
      orderNumberValue : '834080052',
      orderData : undefined as orderData | undefined,
      block_3_Error : '',
      moySkladToken : '4faf280d35fe37d5529bd78b8c19b163babf38d9',
      isMoySkladLoading : false,
    }
  },
  setup(){
    return {};
  },
  methods : {

    getAmwayOrder(e : Event) {
      e.preventDefault();

      if (this.isBlock)
      {
        return;
      }

      this.block_1_Error = '';

      if (this.orderNumberValue.length == 0)
      {
        this.block_1_Error = 'Ошибка: введите номер заказа!';
      }
      else
      {
        this.isOrderLoading = true;
        this.orderData = undefined;
        this.isBlock = true;

        amwayFactory.getOrderData(this.orderNumberValue)
        .then((result)=>{
          this.isBlock = false;
          this.isOrderLoading = false;
          this.orderData = result;
        })
        .catch((e)=>{
          this.isBlock = false;
          this.isOrderLoading = false;

          if (e.message == 'Incorrect data')
          {
            this.block_1_Error = 'Получены некорректные данные с сервера Amway!';
          }
          else
          {
            this.block_1_Error = 'Ошибка при чтении заказа! Попробуйте зайти на сайт kz.amway.com и обновить страницу (для перезаписи сессии авторизации)!';
          }
        });
      }
    },

    countOrderSum(goods : orderDataItemGood[]) : number {
      let result = new BigNumber(0);
      for (let item of goods)
      {
        result = result.plus(new BigNumber(item.quantity).multipliedBy(new BigNumber(item.price)));
      }
      return result.toNumber();
    },

    safeMul(a : number, b : number) : number {
      return new BigNumber(a).multipliedBy(new BigNumber(b)).toNumber();
    },

    coolNumber(v : number | string) : string
    {
      return numberFormat(v, (v == parseInt(v.toString()) ? 0 : 2), ',', ' ');
    },

    sendToMoySklad(e : Event) {
      e.preventDefault();

      if (this.isBlock)
      {
        return;
      }

      this.block_3_Error = '';

      if (this.moySkladToken.length == 0)
      {
        this.block_3_Error = 'Токен доступа не указан!';
      }

      if (this.block_3_Error === '')
      {
        this.isMoySkladLoading = true;
        //this.isBlock = true;
      }
    }
  },
  computed : {

    haveAmwayAuth() : boolean {
      let result = false;
      for (let cookie of this.amwayCookies)
      {
        if (cookie.name == 'JSESSIONID' && cookie.value.length > 0)
        {
          result = true;
          break;
        }
      }
      return result;
    },

    orderDataForLoop() : orderDataItem[] {
      if (this.orderData !== undefined)
      {
        return [this.orderData.order, ...this.orderData.subOrders];
      }
      else {
        return [];
      }
    }

  },
  mounted() {

    amwayFactory.getAmwayCookies()
    .then((cookies)=>{
      this.isLoading = false;
      this.amwayCookies = cookies;
    });
  }
});

</script>