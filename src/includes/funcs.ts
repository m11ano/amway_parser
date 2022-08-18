
export function numberFormat(number : string | number, decimals : number = 0, dec : string = '.', sep : string = ',') : string
{
    number = number.toString().replace(/[^0-9+\-Ee.]/g, '') as string;

    let n = !isFinite(+number) ? 0 : +number;
    let prec = !isFinite(decimals) ? 0 : Math.abs(decimals);

    let toFixedFix = function(n : number, prec : number) {
        var k = Math.pow(10, prec);
        return '' + (Math.round(n * k) / k).toFixed(prec);
    };

    let s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3)
    {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }

    if ((s[1] || '').length < prec)
    {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }

    return s.join(dec);
}