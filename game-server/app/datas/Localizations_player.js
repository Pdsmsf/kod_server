"use strict"

var player = {}
module.exports = player

player["MuteTitle"] = {
	key:"MuteTitle",
	cn:(function () {/*你被禁言*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*You are muted*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*你被禁言*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*Vous avez été mis en sourdine*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["MuteContent"] = {
	key:"MuteContent",
	cn:(function () {/*你被MOD-%s禁言%d分钟,禁言原因:%s。 */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*You are muted by MOD-%s for %d minutes, reason: %s. */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*你被墨子[%s]禁言%d分钟,禁言原因:%s*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*Vous avez été mis en sourdine par MOD-%s pour %d minutes, raison: %s.*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["UnMuteTitle"] = {
	key:"UnMuteTitle",
	cn:(function () {/*禁言被提前解除*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*You are unmuted*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*禁言被提前解除*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*Vous n'êtes plus sous sourdine*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["UnMuteContent"] = {
	key:"UnMuteContent",
	cn:(function () {/*你被提前解除了禁言,请爱护聊天环境,健康聊天*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*You are unmuted ahead of time.*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*你被提前解除了禁言,请珍惜聊天环境,健康聊天*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*La sourdine vous effectant a été enlevé avant la fin prévue.*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["ChatMuteNotice"] = {
	key:"ChatMuteNotice",
	cn:(function () {/*[%s]被MOD[%s]禁言%d分钟,禁言原因:%s。 */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*%s is muted by MOD-%s for %d minutes, reason: %s. */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*[%s]被墨子[%s]禁言%d分钟,禁言原因:%s*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*%s a été mis en sourdine par MOD-%s pour %d minutes, raison: %s.*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["welcomeMailTitle_wp"] = {
	key:"welcomeMailTitle_wp",
	cn:(function () {/*欢迎您加入《魔龙创世纪》！*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*Welcome to Dragonfall!*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*歡迎您加入《魔龍創世紀》！*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*Bienvenue dans DragonFall!*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["welcomeMailContent_wp"] = {
	key:"welcomeMailContent_wp",
	cn:(function () {/*亲爱的领主大人：

    欢迎您加入即时策略游戏《魔龙创世纪》！

    在这里，您可以：

     收集物资，玩转城市建设，创造一个个性化的帝国
     丰富的兵种，强大的装备等待你来发掘
     训练并提升你的巨龙，带领史诗级的部队出征
     探索各式各样未知的领土
     与其他玩家组成联盟，共同征服敌人，建立最强王国
     便捷的语言翻译功能，与世界各地玩家共同制定游戏策略

     
     如果在游戏中遇到什么问题，您可以通过游戏内的“联系我们”和我们沟通。
 
     祝您游戏愉快！


魔龙创世纪 团队*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*Dear Lord:

    Welcome to join Dragonfall!

    Have you ever dreamed of commanding Dragons? Now, try it here in Dragonfall, a wonderful hard-core MMO strategy game! Play for free with Millions of players and make prudent choices for each step of your growth, or bear the risk of defeats! Join an Alliance to fight for the throne with the ultimate power of Dragons, win a place for your kingdom in this land of fantasia!

    You, a heroic warlord of the Knights, died in the crusade against the Black Dragon. But for an unknown purpose the evil dragon resurrected you, granted you the mysterious ability of commanding other dragons. By coming back you find the Empire been ripped apart by betrayers, and the civilians suffer deeply from the war. Will you unify the broken Empire again? Will you be strong enough to take vengeance on the Black Dragon? Establish your kingdom, build your army, and prove yourself in the cruel war field!


    If you have any problems or suggestions, please feel free to contact us via the "Contact Us" in our game.

    Thank you and have fun!


Dragonfall Team*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*"親愛的領主大人：

    歡迎您加入即時策略遊戲《魔龍創世紀》！

    在這裏，您可以：

     收集物資，玩轉城市建設，創造一個個性化的帝國
     豐富的兵種，強大的裝備等待您來發掘
     訓練並提升你的巨龍，帶領史詩級的部隊出征
     探索各式各樣未知的領土
     與其他玩家組成聯盟，共同征服敵人，建立最強王國
     便捷的語言翻譯功能，與世界各地玩家共同制定遊戲策略

     
     如果在遊戲中遇到什麽問題，您可以通過遊戲內的“聯系我們”和我們溝通。
 
     祝您遊戲愉快！


魔龍創世紀 團隊"*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*"Cher Seigneur:

Bienvenue à Dragonfall!

Avez-vous déjà rêvé de commander des dragons? Maintenant, essayez-le ici dans Dragonfall, un merveilleux jeu MMO de stratégie! Jouez gratuitement avec des millions de joueurs et faites des choix judicieux pour chaque étape de votre croissance, ou supportez le risque de défaites! Joignez une alliance pour vous battre pour le trône avec le pouvoir ultime des dragons, gagner une place pour votre royaume dans ce pays de Fantasia!

Vous, un héroïque chef de guerre des Chevaliers, mort dans la croisade contre le Dragon Noir, qui dans un but inconnu, vous a ressuscité et accordé la capacité mystérieuse de commander d'autres dragons. En revenant, vous trouvez l'Empire déchiré par des traîtres. Et les civils souffrent énormément de cette guerre. Voulez-vous à nouveau unifier l'Empire brisé? Serez-vous assez fort pour vous venger du Dragon Noir? Établissez votre royaume, construisez votre armée, et prouvez votre valeur sur le cruel champ de guerre!


Si vous avez des problèmes ou suggestions, s'il vous plaît contactez-nous via "Contactez-nous" dans le jeu.

Merci et amusez-vous!


L'équipe de DragonFall"
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["welcomeMailTitle_ios"] = {
	key:"welcomeMailTitle_ios",
	cn:(function () {/*欢迎您加入《巨龙争霸》！*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*Welcome to Dragon War!*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*歡迎您加入《巨龍爭霸》！*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*Bienvenue dans Dragon War!*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
player["welcomeMailContent_ios"] = {
	key:"welcomeMailContent_ios",
	cn:(function () {/*亲爱的领主大人：

    欢迎您加入即时策略游戏《巨龙争霸》！

    在这里，您可以：

     收集物资，玩转城市建设，创造一个个性化的帝国
     丰富的兵种，强大的装备等待你来发掘
     训练并提升你的巨龙，带领史诗级的部队出征
     探索各式各样未知的领土
     与其他玩家组成联盟，共同征服敌人，建立最强王国
     便捷的语言翻译功能，与世界各地玩家共同制定游戏策略


     如果在游戏中遇到什么问题，您可以通过游戏内的“联系我们”以及以下方式和我们沟通：
 
     官方玩家QQ群：575936673
     官方微信公众号：jituohudong

      祝您游戏愉快！


巨龙争霸 团队*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	en:(function () {/*Dear Lord:

    Welcome to join Dragon War!

    Have you ever dreamed of commanding Dragons? Now, try it here in Dragon War, a wonderful hard-core MMO strategy game! Play for free with Millions of players and make prudent choices for each step of your growth, or bear the risk of defeats! Join an Alliance to fight for the throne with the ultimate power of Dragons, win a place for your kingdom in this land of fantasia!

    You, a heroic warlord of the Knights, died in the crusade against the Black Dragon. But for an unknown purpose the evil dragon resurrected you, granted you the mysterious ability of commanding other dragons. By coming back you find the Empire been ripped apart by betrayers, and the civilians suffer deeply from the war. Will you unify the broken Empire again? Will you be strong enough to take vengeance on the Black Dragon? Establish your kingdom, build your army, and prove yourself in the cruel war field!


    If you have any problems or suggestions, please feel free to contact us via the "Contact Us" in our game.

    Thank you and have fun!


Dragon War Team*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	tw:(function () {/*"親愛的領主大人：

    歡迎您加入即時策略遊戲《巨龍爭霸》！

    在這裏，您可以：

     收集物資，玩轉城市建設，創造一個個性化的帝國
     豐富的兵種，強大的裝備等待你來發掘
     訓練並提升你的巨龍，帶領史詩級的部隊出征
     探索各式各樣未知的領土
     與其他玩家組成聯盟，共同征服敵人，建立最強王國
     便捷的語言翻譯功能，與世界各地玩家共同制定遊戲策略


     如果在遊戲中遇到什麽問題，您可以通過遊戲內的“聯系我們”以及以下方式和我們溝通：
 
     官方玩家QQ群：575936673
     官方微信公眾號：jituohudong

      祝您遊戲愉快！


巨龍爭霸 團隊"*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],
	fr:(function () {/*"Cher Seigneur:

Bienvenue à Dragon War!

Avez-vous déjà rêvé de commander des dragons? Maintenant, essayez-le ici dans Dragon War, un merveilleux jeu MMO de stratégie! Jouez gratuitement avec des millions de joueurs et faites des choix judicieux pour chaque étape de votre croissance, ou supportez le risque de défaites! Joignez une alliance pour vous battre pour le trône avec le pouvoir ultime des dragons, gagner une place pour votre royaume dans ce pays de Fantasia!

Vous, un héroïque chef de guerre des Chevaliers, mort dans la croisade contre le Dragon Noir, qui dans un but inconnu, vous a ressuscité et accordé la capacité mystérieuse de commander d'autres dragons. En revenant, vous trouvez l'Empire déchiré par des traîtres. Et les civils souffrent énormément de cette guerre. Voulez-vous à nouveau unifier l'Empire brisé? Serez-vous assez fort pour vous venger du Dragon Noir? Établissez votre royaume, construisez votre armée, et prouvez votre valeur sur le cruel champ de guerre!


Si vous avez des problèmes ou suggestions, s'il vous plaît contactez-nous via "Contactez-nous" dans le jeu.

Merci et amusez-vous!


L'équipe de Dragon War"
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
}
