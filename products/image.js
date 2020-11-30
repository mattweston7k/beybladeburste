const Product = {
    brochure: id => {
        switch (parseInt(id)) {
            case 171:
                return ['202007_b171.jpg'];
            case 128:
            case 126:
                return ['bey_b' + id + '_2_72.jpg', 'bey_b' + id + '_1_72.jpg'];
            case 98:
                return ['bey_b' + id + '_72_2.jpg', 'bey_b' + id + '_72_1.jpg'];
            case 174:
            case 156:
            case 153:
            case 151:
            case 149:
            case 146:
            case 140:
            case 121:
                return ['bey_b' + id + '_2.jpg', 'bey_b' + id + '_1.jpg'];
            case 130:
            case 129:
            case 127:
            case 125:
            case 122:
            case 97:
                return ['bey_b' + id + '_72.jpg'];
            case 65:
                return ['bey_b59_0.jpg'];
            case 64:
            case 63:
                return ['bey_b' + id + '_0.jpg'];
            default:
                return ['bey_b' + `${id}`.padStart(2, '0') + '.jpg'];
        }
    },
    image: no => {
        if (/^BG-0[123]/.test(no))
            return no;
        if (/^BA-01/.test(no))
            return 'https://img.biggo.com.tw/sESou3p27oTebKM_ciIqJnPH8zIa0NfDW4Jvpmbf1OAc/https://cfshopeetw-a.akamaihd.net/file/c2b2f62535578ca3b604d1d5d95d57b1';
        if (/^BA-02/.test(no))
            return 'https://ct.yimg.com/xd/api/res/1.2/vYdfavcriXmhODfeHxKeug--/YXBwaWQ9eXR3YXVjdGlvbnNlcnZpY2U7aD02MDA7cT04NTtyb3RhdGU9YXV0bzt3PTYwMA--/https://s.yimg.com/ob/image/c4d8642f-cae6-473f-b763-bb50f7186288.jpg';
        if (/^BA-03/.test(no))
            return 'https://www.toysrus.com.hk/www/4001/files/13274a.jpg';
        if (/^BA-04/.test(no))
            return 'https://ct.yimg.com/xd/api/res/1.2/42QonUWAs7dwFUrFhnp5og--/YXBwaWQ9eXR3YXVjdGlvbnNlcnZpY2U7aD03NDA7cT04NTtyb3RhdGU9YXV0bzt3PTgwMA--/https://s.yimg.com/ob/image/410c9674-367e-46f5-9d8d-8b9441857106.jpg';

        if (/^BBG-(15|20|28|33)/.test(no))
            return `https://beyblade.epizy.com/img/${no}.png`;
        if (no == 'BBG-02')
            return 'https://img.ponparemall.net/imgmgr/25/00115525/0/itn3/51001860_2.jpg';
        if (no == 'BBG-09')
            return 'https://www.suruga-ya.jp/database/pics_light/game/607107174.jpg';
        if (no == 'BBG-13')
            return 'https://www.suruga-ya.jp/database/pics_light/game/607144843.jpg';
        if (no == 'BBG-07')
            return 'BB-00';
        if (no == 'BBG-18')
            return 'B_00_emperorF';
        if (no == 'BBG-21') //S&F
            return 'https://dmwysfovhyfx3.cloudfront.net/img/goods/5/4904810123903_c1ac6b63b063454c965a777519693151.jpg';
        if (no == 'BBG-31') //MFB
            return 'https://dmwysfovhyfx3.cloudfront.net/img/goods/5/4904810144670_40f71a6d4ee947f29b6b25ceccba3a3f.jpg';
        if (no == 'BBG-35') //V
            return 'https://dmwysfovhyfx3.cloudfront.net/img/goods/5/4904810163787_61c1fd59201c4cbe8636171592d73eaa.jpg';
        if (no == 'BBG-36') //MFBbaku
            return 'https://d25onbojj3hyk8.cloudfront.net/chozetsu/wp-content/uploads/2020/07/13195549/img_bakuset.jpg';
        if (no == 'BBG-37')
            return 'B-00_bbg37';
        if (/^BBG-(19|22|27)/.test(no))
            return no.replace('BBG-', 'BBG');
        if (/^BBG-(30|34)/.test(no))
            return no.replace('BBG-', 'bbg');
        if (/^BBG-(06|32)/.test(no))
            return no;
        if (/^BBG-/.test(no))
            return no.replace('-', '_');

        const id = no.substring(2, 5);
        if (id >= 129 && id <= 132 || id >= 139 && id <= 154 || id >= 159)
            return no;
        return no.replace('-', '_');
    }
}