interface orderData {
    order : orderDataItem,
    subOrders : orderDataItem[],
    date : Date
}

interface orderDataItem {
    id : string,
    customer : orderDataItemCustomer,
    goods : orderDataItemGood[]
}

interface orderDataItemCustomer {
    id : string,
    sponsorId : string,
    name : string,
    phone ?: string,
    email ?: string,
    address ?: string
}

interface orderDataItemGood {
    id : string,
    quantity : number,
    price : number,
    name : string
}

const Factory = {
    getAmwayCookies() : Promise<chrome.cookies.Cookie[]> {
        return new Promise((ready, reject)=> {
            chrome.cookies.getAll({domain: ".amway.com"}, (cookies) => {
                ready(cookies);
            });
        });
    },

    getOrderData(orderNumber : string) : Promise<orderData> {
        return new Promise((ready, reject)=> {
            fetch(`https://www.kz.amway.com/api/order/${orderNumber}`, {
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET"
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {

                if (data.orderData)
                {
                    try {
                        let orderDataItem : orderData = {
                            order : this.parseOrderFromData(data.orderData, 'KZ'),
                            subOrders : [],
                            date : new Date(data.orderData.created)
                        };

                        let engine = (subCarts : Array<any>)=>{
                            for (let item of subCarts)
                            {
                                orderDataItem.subOrders.push(this.parseOrderFromData(item, 'KZ'));
                            
                                if (typeof item.subCarts == 'object' && item.subCarts.length > 0)
                                {
                                    engine(item.subCarts);
                                }
                            }
                        };

                        if (typeof data.orderData.subCarts == 'object' && data.orderData.subCarts.length > 0)
                        {
                            engine(data.orderData.subCarts);
                        }

                        ready(orderDataItem);
                    }
                    catch (e: unknown)
                    {
                        reject(e as Error);
                    }
                }
                else
                {
                    reject(new Error('Incorrect data'));
                }
            })
            .catch(()=>{
                reject(new Error('Bad request'));
            });
        });
    },

    parseOrderFromData(data : any, postfix : string = '') : orderDataItem {

        if (typeof data.orderedBy != 'object' || typeof data.orderedBy.account != 'object')
        {
            throw(new Error('Incorrect data'));
        }

        let customer : orderDataItemCustomer = {
            id : (typeof data.orderedBy.account.code == 'string' ? data.orderedBy.account.code : ''),
            name : (typeof data.orderedBy.name == 'string' ? data.orderedBy.name : ''),
            sponsorId : (typeof data.orderedBy.account.sponsorAboNumber == 'string' ? data.orderedBy.account.sponsorAboNumber : '')
        };

        customer.name = customer.name.split(/\s+/).map(word => word[0].toUpperCase() + word.substring(1).toLowerCase()).join(' ');

        if (typeof data.orderedBy.phones == 'object')
        {
            let phones : string[] = [];
            for (let phone of data.orderedBy.phones)
            {
                phones.push(`+${phone.phoneCntryCd}${phone.phoneAreaCd}${phone.phoneLocalNum}`);
            }

            if (phones.length > 0)
            {
                customer.phone = phones.join(' ');
            }
        }

        if (typeof data.orderedBy.contactEmail == 'string')
        {
            customer.email = data.orderedBy.contactEmail;
        }

        if (typeof data.orderedBy.defaultBillingAddress == 'object')
        {
            customer.address = data.orderedBy.defaultBillingAddress.country.name;

            if (typeof data.orderedBy.defaultBillingAddress.region == 'object')
            {
                customer.address += ', '+data.orderedBy.defaultBillingAddress.region.name;
            }

            if (typeof data.orderedBy.defaultBillingAddress.town == 'string')
            {
                customer.address += ', '+data.orderedBy.defaultBillingAddress.town;
            }
        }

        let result : orderDataItem = {
            id : (typeof data.code == 'string' ? data.code : ''),
            customer : customer,
            goods : []
        };

        if (typeof data.entries == 'object')
        {
            let components : string[] = [];

            for (let good of data.entries)
            {
                if (typeof good.component == 'object' && typeof good.component.lynxOrderingNumber == 'string')
                {
                    const cId = good.component.lynxOrderingNumber.replace(/\D.*/, '');
                    if (components.includes(cId) == false)
                    {
                        components.push(cId);

                        result.goods.push({
                            id : cId + postfix,
                            quantity : good.componentQuantity,
                            price : good.component.lynxTotalPrice.value,
                            name : '(KZ) ' + good.component.name
                        });
                    }
                }
                else
                {
                    result.goods.push({
                        id : (good.product.alias ? good.product.alias : good.product.code).replace(/\D.*/, '') + postfix,
                        quantity : good.quantity,
                        price : good.basePrice.value,
                        name : '(KZ) ' + good.product.name
                    });
                }
            }
        }

        return result;
    }
};

export default Factory;

export {
    orderData,
    orderDataItem,
    orderDataItemCustomer,
    orderDataItemGood
}