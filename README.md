[![Waffle.io - Columns and their card count](https://badge.waffle.io/setminami/provisioning-checker.svg?columns=all)](https://waffle.io/setminami/provisioning-checker)

# やりたいこと

## Atom 拡張調査
- UI/System/OS般化 何ができて何ができないか
  - Chromeで表現できることは大抵表現できる
  - electronを意識することはまずない
- 何がうれしいか
  - 書き方に気をつければ、webと共通実装にできそう
  - chromeデバッガが比較的使いやすい
    - super+shift+p [reload] & [package名]
  - webGLもそのまま使える？ (今後の課題)
- tips
  - Atom独自実装でないところは、ES仕様を調べるより、HTML5の仕様として探した方が捗る
    - 文字列によるSystem変数一覧とかES/atom/electron仕様からたぐってもなかなか出てこないことが多い
  - 調べるなら
    - [Atom Discuss](https://discuss.atom.io)
      * 大抵すでに議論されている
    - [Packages](https://atom.io/packages)
      * やりたいことがはっきりしていればrepoから読む
    - [Atom APIs](https://atom.io/docs/api/latest/AtomEnvironment)
      * コード例に直リンされていないので、ここから入ると結構混乱する
      * ただし、atom実装を見るならばここ
    - [Node.js](https://nodejs.org/en/docs/)
      * 下回りでどうしても期待通りに動かなければatomからたぐるとわかりがいいことも
  - Atomの例はCoffeeで書かれていることがまだまだ多い
    - 特に難解な言語仕様でもないので大抵何が言いたいかはわかる
    - 細かい表現でよくわからなくなったら [ここ](http://js2.coffee)とか

## 課題
過去pythonで書いたprovisioning X509チェッカーの出力を付加情報として表示する
