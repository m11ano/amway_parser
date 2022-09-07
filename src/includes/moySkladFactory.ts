import {orderData, orderDataItem, orderDataItemCustomer, orderDataItemGood} from '@/includes/amwayFactory';

class moySkladFactory {

    private accessToken : string = '';

    setAccessToken(value : string) : void {
        this.accessToken = value;
    }

    makeApiRequest(action : string, method : 'GET' | 'POST' | 'DELETE' = 'GET', data : object | null = null, search : string = '', headers : {[key : string] : string} = {}, prefix : string = 'entity') : Promise<any> {
        return new Promise((resolve, reject)=> {
            fetch(`https://online.moysklad.ru/api/remap/1.2/${prefix}/${action}${search.length > 0 ? '?search='+encodeURIComponent(search) : ''}`, {
                body: (data === null ? null : JSON.stringify(data)),
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                    ...headers
                }
            })
            .then((response) => {
                return response.json();
            })
            .then(async (data) => {
                await new Promise(r => setTimeout(r, 50));
                resolve(data);
            })
            .catch(async (e)=>{
                await new Promise(r => setTimeout(r, 50));
                reject(e);
            });
        });
    }

    async getOrCreateProject(name : string, comment : string = '')
    {
        const projects = await this.makeApiRequest('project', 'GET', null, name);
        if (typeof projects.rows == 'object')
        {
            for (let item of projects.rows)
            {
                if (item.name === name)
                {
                    return item;
                }
            }
        }

        const project = await this.makeApiRequest('project', 'POST', {
            name: name,
            code: name,
            description: comment
        });

        return project;
    }

    async getOrCreateСounterparty(customer : orderDataItemCustomer) : Promise<[boolean, any]>
    {
        const search = await this.makeApiRequest('counterparty', 'GET', null, customer.id);
        if (typeof search.rows == 'object')
        {
            for (let item of search.rows)
            {
                if (customer.id.toString() == item.code)
                {
                    return [false, item];
                }
            }
        }

        let counterpartyData : any = {
            companyType : 'individual',
            name : customer.name,
            code : customer.id.toString(),
            description : 'Создано через плагин chrome.',
            legalAddress : customer.address ? customer.address : '--- Нужно заполнить ---',
            attributes : [
                {
                    meta : {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/counterparty/metadata/attributes/b7bb494f-e4ad-11ec-0a80-0b270031f356",
                        "type": "attributemetadata",
                        "mediaType": "application/json"
                    },
                    name : "НПА",
                    type : "string",
                    value : customer.id.toString(),
                },
                {
                    meta : {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/counterparty/metadata/attributes/6d7ccfce-e4ad-11ec-0a80-007e00331268",
                        "type": "attributemetadata",
                        "mediaType": "application/json"
                    },
                    name : "DD",
                    type : "string",
                    value : "--- Нужно указать ---",
                },
                {
                    meta : {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/counterparty/metadata/attributes/3eb749bf-e4af-11ec-0a80-0cea0033a6ac",
                        "type": "attributemetadata",
                        "mediaType": "application/json"
                    },
                    name : "Спонсор",
                    type : "string",
                    value : 'НПА '+customer.sponsorId.toString(),
                }
            ]
        };

        if (customer.email)
        {
            counterpartyData.email = customer.email;
        }

        if (customer.phone)
        {
            counterpartyData.phone = customer.phone;
        }

        const counterparty = await this.makeApiRequest('counterparty', 'POST', counterpartyData);

        return [true, counterparty];
    }

    async getOrCreateGood(good : orderDataItemGood) : Promise<[boolean, any]>
    {
        const search = await this.makeApiRequest('product', 'GET', null, good.id);
        if (typeof search.rows == 'object')
        {
            for (let item of search.rows)
            {
                if (good.id == item.code)
                {
                    return [false, item];
                }
            }
        }


        let goodData : any = {
            name : good.name,
            code : good.id.toString(),
            article : good.id.toString(),
            description : 'Создано через плагин chrome. Отредактируйте единицы измерения, группу и остальные данные, если требуется.',
            minPrice : {
                value : 0,
                currency: {
                    "meta": {
                      "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                      "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                      "type": "currency",
                      "mediaType": "application/json"
                    }
                }
            },
            buyPrice : {
                value : 0,
                currency: {
                    "meta": {
                      "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                      "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                      "type": "currency",
                      "mediaType": "application/json"
                    }
                }
            },
            salePrices: [
                {
                  "value": good.price*100,
                  "currency": {
                    "meta": {
                      "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                      "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                      "type": "currency",
                      "mediaType": "application/json"
                    }
                  },
                  "priceType": {
                    "meta": {
                      "href": "https://online.moysklad.ru/api/remap/1.2/context/companysettings/pricetype/0940c41f-ddf7-11ec-0a80-06c800135d1b",
                      "type": "pricetype",
                      "mediaType": "application/json"
                    }
                  }
                },
                {
                    "value": good.price*100,
                    "currency": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                        "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                        "type": "currency",
                        "mediaType": "application/json"
                      }
                    },
                    "priceType": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/context/companysettings/pricetype/2edc9d4f-ddfc-11ec-0a80-06c800138932",
                        "type": "pricetype",
                        "mediaType": "application/json"
                      }
                    }
                },
                {
                    "value": good.price*100,
                    "currency": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                        "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                        "type": "currency",
                        "mediaType": "application/json"
                      }
                    },
                    "priceType": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/context/companysettings/pricetype/2edc9eae-ddfc-11ec-0a80-06c800138933",
                        "type": "pricetype",
                        "mediaType": "application/json"
                      }
                    }
                },
                {
                    "value": 0,
                    "currency": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                        "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                        "type": "currency",
                        "mediaType": "application/json"
                      }
                    },
                    "priceType": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/context/companysettings/pricetype/7a27e4ed-ddff-11ec-0a80-036f00127fdb",
                        "type": "pricetype",
                        "mediaType": "application/json"
                      }
                    }
                },
                {
                    "value": 0,
                    "currency": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                        "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                        "type": "currency",
                        "mediaType": "application/json"
                      }
                    },
                    "priceType": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/context/companysettings/pricetype/7a27e5e5-ddff-11ec-0a80-036f00127fdc",
                        "type": "pricetype",
                        "mediaType": "application/json"
                      }
                    }
                },
                {
                    "value": 0,
                    "currency": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                        "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                        "type": "currency",
                        "mediaType": "application/json"
                      }
                    },
                    "priceType": {
                      "meta": {
                        "href": "https://online.moysklad.ru/api/remap/1.2/context/companysettings/pricetype/cd301061-de82-11ec-0a80-06c9000bb979",
                        "type": "pricetype",
                        "mediaType": "application/json"
                      }
                    }
                }
            ],
            country : {
                "meta": {
                    "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/76732d5d-da84-4f9d-967d-5a9f0ab453b2",
                    "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/country/metadata",
                    "type": "country",
                    "mediaType": "application/json"
                }
            }
        };

        const product = await this.makeApiRequest('product', 'POST', goodData);

        return [true, product];
        
    }

    async createOrder(order : orderData) : Promise<{newCounterpartiesCount : number, newGoodsCount : number, newOrdersCount : number}> {
        try {

            //Создаем проект
            let project = await this.getOrCreateProject(order.order.id+'AK', `Заказ от ${(order.date.getDate() < 10 ? '0' : '')+order.date.getDate()+'.'+(order.date.getMonth() < 9 ? '0' : '')+(order.date.getMonth() + 1)+'.'+order.date.getFullYear()}. Создано через плагин chrome.`);

            //Создаем контрагентов
            let newCounterpartiesCount = 0;
            let counterparties : {[key : string] : any} = {};

            let result = await this.getOrCreateСounterparty(order.order.customer);
            counterparties[order.order.customer.id] = result[1];
            newCounterpartiesCount += result[0] ? 1 : 0;

            for (let item of order.subOrders)
            {
                result = await this.getOrCreateСounterparty(item.customer);
                counterparties[item.customer.id] = result[1];
                newCounterpartiesCount += result[0] ? 1 : 0;
            }
           
            //Создаем товары

            let allGoods : { [key : string] : orderDataItemGood} = {};
            let newGoodsCount = 0;

            for (let item of order.order.goods)
            {
                allGoods[item.id] = item;
            }

            for (let subOrder of order.subOrders)
            {
                for (let item of subOrder.goods)
                {
                    allGoods[item.id] = item;
                }
            }

            let goods : {[key : string] : any} = {};

            for (let i in allGoods)
            {
                let result = await this.getOrCreateGood(allGoods[i]);
                goods[i] = result[1];
                newGoodsCount += result[0] ? 1 : 0;
            }

            //Функция создания заказа покупателя в Мой Склад
            let makeOrder = async (orderItem : orderDataItem) : Promise<boolean> =>
            {
                const search = await this.makeApiRequest('customerorder', 'GET', null, orderItem.id+'-AmwayOrder');
                if (typeof search.rows == 'object')
                {
                    for (let item of search.rows)
                    {
                        if (orderItem.id+'-AmwayOrder' == item.name)
                        {
                            return false;
                        }
                    }
                }

                let orderData : any = {
                    project : {
                        meta : project.meta
                    },
                    organization : {
                        "meta": {
                          "href": "https://online.moysklad.ru/api/remap/1.2/entity/organization/093ee2c8-ddf7-11ec-0a80-06c800135d13",
                          "type": "organization",
                          "mediaType": "application/json"
                        }
                    },
                    agent : {
                        meta: counterparties[orderItem.customer.id].meta
                    },
                    name : orderItem.id+'-AmwayOrder',
                    moment : `${order.date.getFullYear()}-${(order.date.getMonth()>8 ? '' : '0') + (order.date.getMonth()+1)}-${(order.date.getDate()>9 ? '' : '0') + order.date.getDate()} ${(order.date.getHours()>9 ? '' : '0') + order.date.getHours()}:${(order.date.getMinutes()>9 ? '' : '0') + order.date.getMinutes()}:00`,
                    rate : {
                        currency : {
                            "meta": {
                                "href": "https://online.moysklad.ru/api/remap/1.2/entity/currency/d3461fe0-ddf9-11ec-0a80-01ef00125213",
                                "metadataHref": "https://online.moysklad.ru/api/remap/1.2/entity/currency/metadata",
                                "type": "currency",
                                "mediaType": "application/json"
                            }
                        }
                    },
                    positions : []
                };

                for (let good of orderItem.goods)
                {
                    orderData.positions.push({ 
                        quantity: good.quantity,
                        price: good.price*100,
                        assortment: {
                            meta: goods[good.id].meta
                        }
                    });
                }

                await this.makeApiRequest('customerorder', 'POST', orderData);

                return true;
            };

            let newOrdersCount = 0;
            let isOk = await makeOrder(order.order);
            newOrdersCount += isOk ? 1 : 0;

            for (let subOrder of order.subOrders)
            {
                isOk = await makeOrder(subOrder);
                newOrdersCount += isOk ? 1 : 0;
            }

            return {
                newCounterpartiesCount,
                newGoodsCount,
                newOrdersCount
            };
        }
        catch (e : unknown)
        {
            throw e;
        }
    }
}
   
export default moySkladFactory;

export {

}