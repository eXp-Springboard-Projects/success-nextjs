import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Hardcoded members data from the paste you provided
const membersData = `59365405051	Ambrish R	Kochikar	ambrish.kochikar@exprealty.net	+13125453080			2025-05-30 11:00		Marketing contact	2024-09-18 14:41
2085914	James	Stanton	jjs0501@hotmail.com	+13039405713				Non-marketing contact	2021-02-08 15:26
472698154	Jason	Hall	jason.b.hall@exprealty.com	+19195247424				Marketing contact	2023-10-11 17:05
91070890530	Rochelle	Herring Peniston	rochelleherring00@gmail.com	9739644307				Marketing contact	2025-01-12 15:16
89744093495	Thomas	White	thomasmwhite7@gmail.com	7578790236				Marketing contact	2025-01-07 14:00
81393543543	DHARSHAKA	DIAS	dharshaka.dias@outlook.com	+15735873341				Marketing contact	2024-12-01 01:03
317575651	Jennifer	Jones	jenn@jj.team	+12898797213		2025-12-15 14:31		Marketing contact	2022-08-23 16:34
1214980	Judson	Maillie	judson@maillie.net					Marketing contact	2021-02-04 14:10
56743008063	Errol	Boreland	eboreland@jhbrokersagency.com	+18453750516				Marketing contact	2024-09-10 13:16
95285374333	Anna	Wenner	annamwenner@gmail.com	+17852159773				Marketing contact	2025-01-29 12:37
673296	Sara	Bird	sjmurphy79@gmail.com	'+61401905605				Marketing contact	2021-02-02 13:15
2086657	Cynthia	Hageman	cindyhageman@yahoo.com	+14697748843				Marketing contact	2021-02-08 15:26
771861	Tristan	Holmes	t.patriot96@gmail.com	+12564100511	Kristen McMahon	2025-07-01 19:36		Marketing contact	2021-02-02 16:34
67846955	Martin	Gaedke	martin@gaedke.com	+491716440661				Non-marketing contact	2021-06-24 08:52
711979	Mark	Whitridge	markwhitridge@gmail.com	+13035146127				Marketing contact	2021-02-02 14:48
130251751	Gwendolyn	Myers	sgmyers22@gmail.com	+19124322927				Marketing contact	2021-09-21 09:35
944680	Raed	Almubarak	raed.almubarak@gmail.com			2025-11-26 13:43		Marketing contact	2021-02-03 13:53
77060658709	Joao	Gavazzi	joao.gavazzi@gmail.com	+642102227875				Marketing contact	2024-11-12 13:58
88457515845	Bob	Seaton	bseaton@monogramhomes.net	7404042984				Marketing contact	2025-01-01 21:02
73191608492	Susan	Free	susan.m.free@gmail.com	7173189937	Kristen McMahon	2025-06-30 21:01		Marketing contact	2024-10-29 10:59
367420885	Jose	Arandia	joselomarandia@gmail.com	+1660347754		2025-03-08 08:34		Marketing contact	2022-12-20 09:28
92881380111	Daniel	Astacio	mr.danielastacio@gmail.com	+18132031303		2025-04-10 23:19		Non-marketing contact	2025-01-20 11:17
23675933455	Rob	Baird	tampaappraiser@hotmail.com	+18135032936				Marketing contact	2024-05-23 06:12
953396	Tami	Rabellino	rktami@yahoo.com	+15617622812				Marketing contact	2021-02-03 13:53
95918676761	Ashley	Davis	ales2652@gmail.com	+16268248774				Marketing contact	2025-01-31 22:08
86463975564	lavanya	nagineni	lavanya_duvvuri@hotmail.com	+18176005421				Marketing contact	2024-12-20 15:12
759885	Maria Theresa	Cauchi Gera	tessiecg@gmail.com	+35679914330	Katey Dallosto (Deactivated User)	2025-07-14 15:45		Marketing contact	2021-02-02 16:34
315424901	Nancy	Duarte	nancyduartelifecoach@gmail.com	+17542447992				Marketing contact	2022-08-09 12:50
1239130	Don	Wirth	wdwirth116@gmail.com	+16307791326				Marketing contact	2021-02-04 14:11
671811	Robert	Opsenica	ropsenica@gmail.com	+17733556714				Marketing contact	2021-02-02 13:15
83633735593	Bjørn Barfoed	Vestergaard	bjorn@barfoed.biz	+4529933331				Marketing contact	2024-12-10 08:32
1196355	Madhur	Aggarwal	madhur0206@gmail.com					Marketing contact	2021-02-04 14:10
100716882	Jermaine	Bradley	jermainebradley3339@yahoo.com	+17066919137		2025-09-08 16:30		Marketing contact	2021-08-16 16:00
60970110017	Kelly	Arce	kellyarcecreative@gmail.com	'+17147659127				Non-marketing contact	2024-09-23 09:52
22174725	Victoria B	Thompson	vbthompson52@gmail.com	(602) 705-1897				Marketing contact	2021-03-31 10:41
707421	Robert	Ticse	rmticse@gmail.com	+17329394441				Marketing contact	2021-02-02 14:48
1994310	Randall	White Sr	rjwhitesr2@gmail.com	7576106905				Marketing contact	2021-02-08 14:57
94428080918	Glenn	Bakewell	glenn.bakewell@gmail.com	+15166737225				Marketing contact	2025-01-26 16:47
764241	Brian	King	kingbg@gmail.com	+12893395373				Marketing contact	2021-02-02 16:34
339620701	Angela	Hauer	angela@angelacoachingco.com	+16513086595				Marketing contact	2022-10-16 19:09
168816232	Klaas	Hoherz	klaas.hoherz@gmail.com	+4915258473565				Marketing contact	2021-11-10 12:50
100722023	Karolina	Kovács	vkovacskarolina@gmail.com	+36203596188				Marketing contact	2021-08-16 16:00
442201651	Yen	Ho	yenie_ho@yahoo.com.au	+61415066888				Marketing contact	2023-06-28 18:27
363095767	Melinda	Subscriber	mindylprice@gmail.com	+13602241065		2025-08-11 12:18		Marketing contact	2022-12-09 14:30
744062	Norman	Castillo	castlesea@gmail.com	+48519823905	Kristen McMahon	2025-03-27 19:46		Marketing contact	2021-02-02 16:34
752253	Barry	Katz	bkatz@faircapgroup.com	+19177766312				Marketing contact	2021-02-02 16:34
26230	Kirsten	Walker	kirstenw@riseservicesinc.org	4803860482				Marketing contact	2021-01-28 18:43
94775087716	Trudy	McMaster	trudymcmaster79@gmail.com	+61415675075				Marketing contact	2025-01-27 17:05
86894185253	Rob	Difazio	djrobpeters@gmail.com	7818580437				Marketing contact	2024-12-23 11:42
61864792860	Francisco	Lazo	ciscolazo@yahoo.com	+17872433693				Marketing contact	2024-09-25 15:36
28289	Amy	Nigro	amyw0@yahoo.com	+19414083010				Marketing contact	2021-01-28 18:43
85360326478	Lisa	Fitzgibbon	lisa@oomphhealth.co.nz	+64212365646				Non-marketing contact	2024-12-16 18:56
100701058	William	Burns	williamdburns@hotmail.com	2108874089				Marketing contact	2021-08-16 15:59
67413703342	Cicley	Gay	cgay@amplifiersinc.com	+14048395700				Marketing contact	2024-10-14 13:46
76331797287	Bhavesh	Solanki	bsolanki999@hotmail.com	4402380255				Non-marketing contact	2024-11-09 08:20
2091154	Alex	Lange	alex@alexlangenow.com	+12068175998				Marketing contact	2021-02-08 15:26
63907597744	Jigna	Patel	jigna@sigmataxes.com	+12405935814				Marketing contact	2024-10-02 08:29
26769	Douglas	Osborne	dougwald2000@hotmail.com	+6421879525				Non-marketing contact	2021-01-28 18:43
56417345320	Erin	Evans	erin@c21islandhomes.com	+18082925722		2025-12-03 22:35		Marketing contact	2024-09-09 14:12
127193101	Jim	Nissen	jim@commandshiftoption.com	+16023152667				Marketing contact	2021-09-17 14:39
59909984376	Greg	Newman	melissag@sharkeez.net	'+13103749900				Marketing contact	2024-09-19 16:34
935598	Jim	Michlig	james.michlig@muskegonorway.org	+12624223069		2025-10-07 21:30		Marketing contact	2021-02-03 13:53
956078	Justin	Deboer	ufis1@outlook.com	+12106464151				Marketing contact	2021-02-03 13:53
673449	C Scott	Parks	cscottparks1936@gmail.com	'+16309678897				Marketing contact	2021-02-02 13:15
34712757	Tim	Davis	timdavis2010@comcast.net	+19544157346		2025-05-18 20:09		Marketing contact	2021-04-26 18:50
88827304504	Matt	Tetrault	mtetrault86@gmail.com	7749912658				Marketing contact	2025-01-03 13:03
47744928881	Andres	Beltran	abeltra@pucp.edu.pe	991 669 807		2025-10-28 15:57		Marketing contact	2024-08-12 07:30
1244862	Danny	Andreasen	dana@crbr.com	15305701964				Marketing contact	2021-02-04 14:11
19373	Sonja	Jones	sonja@sonjaannjones.com	3109368816				Marketing contact	2021-01-28 18:43
19639	Peter	Nash	peter.nash@red-pencil.co.uk	+447818212127		2025-12-02 16:14		Marketing contact	2021-01-28 18:43
688048	Kyle	Bruce	gkylebruce@gmail.com	678-300-1684				Marketing contact	2021-02-02 13:15
61095756837	Bernardo	Haces	bernardo_haces@hotmail.com	'+522225052779				Marketing contact	2024-09-23 17:06
25790	Raymond	St-Louis	contact@raymondstlouis.com	+15147729464				Marketing contact	2021-01-28 18:43
415302401	Stephen	Robinson	sjr@churchoftheking.com	9852923106				Marketing contact	2023-04-11 10:06
750794	Yvonne	Arnold	yvonne@yvonnearnold.com	+19519163192				Marketing contact	2021-02-02 16:34
2036442	William	Hill	wfhill@gmail.com	(469) 569-8503		2025-11-26 12:07		Marketing contact	2021-02-08 15:11
57140317715	Joanna	Carroll	joannabcarroll99@gmail.com	'+17318792399				Marketing contact	2024-09-11 14:10
70077034807	Robin	Phillips	robin.phillips@exprealty.com	+18432148451				Marketing contact	2024-10-21 09:21
967388	Luis G	Villela	lgramirezv@gmail.com	+525527278726				Marketing contact	2021-02-03 14:09
2105334	Marc	Labadie	marc@labadieauto.com					Marketing contact	2021-02-08 15:26
94158660230	Amy	Tilley	gatilley@sbcglobal.net	8158235682				Marketing contact	2025-01-25 07:52
965847	Sara	Piscator	sara.piscator@gmail.com	+46730891349	Kristen McMahon	2025-12-15 15:43		Marketing contact	2021-02-03 14:09
263389	Kimanzi	Constable	kimanzi@kconstable.com	+14142180971				Marketing contact	2021-03-08 17:19
72358236714	Tracy	Gossett	tgossett01@outlook.com	+17022854439				Non-marketing contact	2024-10-27 01:17
98495180553	Jeffrey	Waller	ljwaller7@gmail.com	+15403355135				Marketing contact	2025-02-10 18:30
337643005	Ed	Laine	ed.laine@exprealty.com	+12062295515	Katey Dallosto (Deactivated User)	2025-07-03 11:00		Marketing contact	2022-10-12 12:34
74535962693	Israa	Nasir	hello@israanasir.com	+13479867475				Marketing contact	2024-11-02 12:53
79050172981	Megan	Hageman	meghagey08@gmail.com	+19372722435				Marketing contact	2024-12-28 11:02
415311654	Roger	Carr	roger@everydaygiving.com	5404292239				Marketing contact	2023-04-11 10:06
938983	Christopher	Maresco	cjmaresco56@gmail.com	+15862921443				Marketing contact	2021-02-03 13:53
13017345293	Monik	Singh	moniksingh99@gmail.com	'+14374374374				Marketing contact	2024-04-16 14:43
499821601	Rebecca	Shapiro	digital@shorefire.com	+17185227171				Marketing contact	2023-12-29 09:43
61822032131	Jack	Boes	boesjack@gmail.com	+14062319002				Marketing contact	2024-09-25 13:22
743161	Jimmy	Williams	jimmy@compasscapitalmgt.com	(918) 423-3222	Kristen McMahon	2025-05-29 13:43		Marketing contact	2021-02-02 16:34
59765984682	Larita	Walters	lmendozawalters@yahoo.com	+18139830018				Non-marketing contact	2024-09-19 10:21
31220	Patty	Pavey	ppavey@ttdcoaching.com	+17654616598				Marketing contact	2021-01-28 18:44
2097130	Lance	Metcalf	lmetcalf@metcalflegal.com	+18178755231				Marketing contact	2021-02-08 15:26
44933201	Michael	Reyes	mikepreyes@gmail.com	+15713321794				Marketing contact	2021-05-16 19:34
97097528476	Suzanne	Driscoll	suzannedriscoll219@gmail.com	+15857327438		2025-03-10 17:09		Marketing contact	2025-02-05 08:14
68272158629	John	Cross	johnhcross@yahoo.com	+19543192515				Marketing contact	2024-10-16 07:24
159522980203	Josh	Dehoet	dehoet10@yahoo.com	8136104909				Marketing contact	2025-09-29 14:44
120415452300	Jacob	Humphrey	jacobhumphrey41@gmail.com	2069418079				Marketing contact	2025-05-09 13:05
122879204725	Kevin	Asbury	kevinasbury@gmail.com	+12148098889				Marketing contact	2025-05-19 18:17
106790543020	Shawna	Gilbert	sg.shawnagilbert@gmail.com	+13037171632		2025-12-10 22:13		Marketing contact	2025-03-17 19:25
136833418864	Cletus	Krater Jr	budkrater@aol.com	2392091040				Marketing contact	2025-07-11 13:15
152921971512	Toan	Hang	subscriptions@jonesworks.com	+19178059639		2025-09-04 13:53		Marketing contact	2025-09-04 11:33
131845342094	Nicole	Kashuba	nicole.kashuba@exprealty.com	+14036608820				Marketing contact	2025-06-23 14:43
171807680936	Molly	Speed	mollykowen@gmail.com	+19786094221		2025-11-12 19:29		Marketing contact	2025-11-04 09:43
127068648822	Erik	Bobbink	bobbinke@gmail.com	+33786137065				Marketing contact	2025-06-04 01:32
107333563399	James	Novick	james.john.novick@outlook.com	+14038039763				Marketing contact	2025-03-19 12:29
171882357147	Jason	Newland	jcnewland@outlook.com	+18598061776				Marketing contact	2025-11-04 13:46
130218902184	KC	Ibedu	contratech25@gmail.com	+16306181116	Kristen McMahon	2025-06-18 23:48		Marketing contact	2025-06-18 01:20
142541077548	Jason	Wang	jason@sonderhometeam.com	+18439262055				Marketing contact	2025-07-30 22:09
114558876854	Bill	Hooley	therealhooley@gmail.com	+18019607425				Marketing contact	2025-04-16 16:50
152055314050	jennifer	knowles	jenniferknowles@gmail.com	+17202022106				Marketing contact	2025-09-01 06:15
122331700359	Edith	Dillman	edie@bpublicprefab.com	+15055774207				Marketing contact	2025-05-16 22:18
147437700110	Michael	Allard	servant@choosehappi.com	+18282302414				Marketing contact	2025-08-15 14:27
132678106160	Danny	Parsons	parsnips123@gmail.com	3254807933				Marketing contact	2025-06-26 15:45
133933403460	Jeremy	Jaynes	jeremy@chinookcontractors.com	3608657593				Marketing contact	2025-07-01 13:08
146233244506	Em	Tvelia	emily.tvelia+fresspass2@success.com	9097903930				Marketing contact	2025-08-12 15:50
127180412033	Allie	Tribe	catalacey@icloud.com	+19405773439				Marketing contact	2025-06-04 12:10
122999836762	Abby	Lewis	abbylewis397@yahoo.com	+18596407186				Marketing contact	2025-05-20 09:00
120614324075	Francis	Gasparotto	francis.gasparotto@katcho.lu	+352691352353				Marketing contact	2025-05-10 03:38
152702983282	Kelvin	Nguyen	kelvin@bitpg.com	+15409998464				Marketing contact	2025-09-03 17:03
120281655844	Yan-Rush	Sainvilus	yysai223@gmail.com	+13056849391				Marketing contact	2025-05-08 20:35
146217865345	Emily	Tvelia	emily.tvelia+freepass3@success.com	+19097093930				Marketing contact	2025-08-12 16:12
154129567767	Tyler	Young	tyler.young705@gmail.com	+13104693579		2025-12-03 23:42		Marketing contact	2025-09-09 23:07
116108051500	Shana	Vitek	slvitek@beermannlaw.com	+17732595292				Marketing contact	2025-04-22 12:24
112967439517	Gail	Nelson	gail@gailbakernelson.com	+18174221981				Marketing contact	2025-04-10 15:04
101491832211	Jorge	Guerrero	mainhealthsolutions.ca@gmail.com	+12086152056				Marketing contact	2025-02-22 20:41
142058567312	Tammera	Collins	maim23tss1@gmail.com	+19034868199				Marketing contact	2025-07-29 09:02
100134362624	Kacy	Zurkus	kacy@penspalsprose.com	+16179703141				Marketing contact	2025-02-17 15:24
121672309392	Lisa	Davis	ldavis@cassinfo.com	+13146067029				Marketing contact	2025-05-14 10:33
144216172196	Evonne Alison	Creamer	alisoncreamer@gmail.com	+17576528880		2025-09-03 23:59		Marketing contact	2025-08-05 08:47
116626534481	Giovanni	Delfino	giovanni@delfinoco.com	+13013851128				Marketing contact	2025-04-24 11:04
100045771924	Rakesh	Jadhav	carakesh78@gmail.com	+919820835030				Marketing contact	2025-02-17 07:51
146885046102	David	Fry	davefryrealestate@gmail.com	+16517755751				Marketing contact	2025-08-14 10:55
117760559740	Maria	Mocerino	mocerinomocerino@gmail.com	+13102915729				Marketing contact	2025-04-29 00:47
167536168765	Lewis	Burrows	ceiceo@yahoo.com	+19164127896				Marketing contact	2025-10-25 09:02
144846760734	ahmad	badreddine	ahmad.badreddine198622@gmail.com	+17868645230				Marketing contact	2025-08-07 14:57
145789118627	Daniel	Zia	daniel@ziagroup.com	+18056377148				Marketing contact	2025-08-11 12:29
164972047431	Patrick	Orender	patrick.orender@mac.com	+12142233731				Marketing contact	2025-10-17 13:39
102930060336	Marca	Rose	marca.rose.phd@gmail.com	+19495021268				Marketing contact	2025-02-28 16:55
121778696116	Emily	Tvelia	emily.tvelia+freepass@success.com	(909) 709-3930				Marketing contact	2025-08-12 15:46
146579188051	Rochelle	Schmidt	rochelle.schmidt@exprealty.com	+16516002065				Marketing contact	2025-08-13 16:08
676619	Lacey	Lockhart	laceylockhart@gmail.com	+17192317700				Marketing contact	2021-02-02 13:15
317096551	Ioannis	Klotsikas	ksjohnny123@gmail.com	+306998515120				Non-marketing contact	2022-08-20 15:44
49708660820	Jesse	Bailey	jess@baileylawfirm.com	5732680525	Katey Dallosto (Deactivated User)	2025-07-28 11:00		Marketing contact	2024-08-19 15:09
510379753	W.Brian	Coggins	wbcogginscga@hotmail.ca	+19053753732				Marketing contact	2024-01-25 13:09
689545	Shelley	Alward Macleod	shelley@hronthego.ca	+19024895469				Marketing contact	2021-02-02 13:15
104031749723	Khayal	Ahmadzada	evordesmanager@gmail.com	+41797111923				Non-marketing contact	2025-03-05 16:10
64035281220	ME	'	jrho89@aol.com	2165341244				Marketing contact	2024-10-02 14:59
100695046	Lewis	Martin	lj.martin@hotmail.com	+15195777246				Marketing contact	2021-08-16 15:59
415302985	Darleen	Ghirardi	dghirardi25@gmail.com	+17022817790		2025-10-08 17:17		Marketing contact	2023-04-11 10:06
73552067344	Crystal	Hersey	crishersey@yahoo.com	+16176425614				Non-marketing contact	2024-10-30 08:28
82935237452	Greg	Shapan	greg.shapan@gmail.com	+19728498922		2025-12-10 13:40		Marketing contact	2024-12-07 09:01
94754003550	Taunya	Pickles	taunya@westcoconstruction.ca	+14033804084				Marketing contact	2025-01-27 18:16
980254	James	Wehrer	jedijimbo@comcast.net	+17326002898				Marketing contact	2021-02-03 14:09
87403188134	Matthew	Wright	mwright@montereyfuelcompany.com	+14803811222				Non-marketing contact	2024-12-26 14:50
3167399	Rolando	Castro	rolando@myelitecreditgroup.com	+13236276345				Marketing contact	2021-02-11 12:18
44111670	Michelle	Musacchio	mmusacchio@fitmoneycpa.com	+15024542755				Marketing contact	2021-05-14 10:38
74295645526	Ben	Spalding	bspaldin@gmail.com	+19378258701				Marketing contact	2024-11-01 08:53
56664583790	Nancy	Hauschildt	nancy@nancyhauschildt.com	'+16192469948				Marketing contact	2024-09-10 11:17
681751	Neil	Holbrook	thisisneilsemail@gmail.com	+12083129594				Marketing contact	2021-02-02 13:15
119689086339	Leticia	Trevino	ltrevino@heffgroup.com	9252952511				Marketing contact	2025-05-06 13:28
87753444919	János	Serényi	dr.serenyi.janos@ertektrend.hu	+36203110010				Non-marketing contact	2024-12-28 16:48
29985	Nancy	Coon	nancyanncoon@live.com	+15209077503				Marketing contact	2021-01-28 18:44
57133943128	Stephanie	Hojan	steph.hojan@gmail.com	+17158913813				Marketing contact	2024-09-11 13:21
109441325	Kimberly	Fraser	kim@thekimfraserteam.com	+14252095638				Marketing contact	2021-08-27 10:57
170944389791	Pete	Socks	pete@sockemwebsolutions.com	+17175213137				Marketing contact	2025-11-01 06:54
148923685529	Jon	Frenz	jfrenz@healthmarkets.com	2392467573		2025-10-08 19:21		Marketing contact	2025-08-20 13:36
58546234140	Althea	Whitingham	althea@e-maax.com	+13053102994				Marketing contact	2024-09-16 09:47
81920522614	Leron	Barnes	getmotivatedkc@gmail.com	+18164691992				Marketing contact	2024-12-03 11:20
104084529984	DR CRISTON	Clark	cclarkdmd@yahoo.com	+14233942304				Marketing contact	2025-03-05 23:52
163265053259	F Keats	Boyd III	plan@boydandboydpc.com	+17743130523				Marketing contact	2025-10-12 12:44
73622199185	Jonathan	Gutierrez	jgutierrez@danco-group.com	'+14242248411				Marketing contact	2024-10-30 13:11
164098617233	Jason	Forrest	jason@fpg.com	8179392741				Marketing contact	2025-10-15 09:11
152688883050	Emily	T	emily.tvelia+testll7@success.com	+19097093930				Marketing contact	2025-09-03 13:11
109440965	April	Stephens	april@aprilstephens.com	+19196250211				Marketing contact	2021-08-27 10:57
509767	Jarrod	Davis	jarroddaviscoach@gmail.com	+16136686742				Marketing contact	2021-02-01 14:57
147655453333	Vinayak	Lahiri	vinayak.lahiri@icloud.com	+33766223410				Marketing contact	2025-08-16 07:01
62693185030	Katieg	Barry	grainne@barryfullam.ie	+353877870556				Marketing contact	2024-09-28 05:57
108358574450	Angelo Nino	Paoli	ninopaoli65@gmail.com	+14064934355				Marketing contact	2025-03-23 22:20
173489890850	Robert	Stopper	rstopper2@gmail.com	+17343959040				Marketing contact	2025-11-09 05:39
84544921372	Liberty	Woods	libertywoods@gmail.com	+16198845812	Katey Dallosto (Deactivated User)	2025-06-30 11:00		Marketing contact	2024-12-13 12:38
58290249753	Stephen	Royall	brentroyall2015@gmail.com	+17046095969		2025-10-28 16:24		Marketing contact	2024-09-15 11:29
1232089	Robert L.	George Jr	info@rlgarchitects.com	+12403753952				Marketing contact	2021-02-04 14:10
2069971	Sanjay	Patel	sanjaynp@hotmail.com	+16198677988				Marketing contact	2021-02-08 15:25
167682468173	Shane	Clardy	shane@clardyrealestate.com	+18647106507				Marketing contact	2025-10-25 17:09
142922796338	Denis	Andrian	denisandrian@gmail.com	3452902780				Marketing contact	2025-08-03 14:58
61853426847	Irene	Field	fieldmarketingcorp@gmail.com	+18506917016	Katey Dallosto (Deactivated User)	2025-10-08 17:17		Marketing contact	2024-09-25 15:57
140045269034	Houcem	Bhouri	bhouri.houcem@gmail.com	+33766741774				Marketing contact	2025-07-21 21:14
152678389799	Emily	Tvelia	emily.tvelia+testll5@success.com	+19097093930				Marketing contact	2025-09-03 12:54
2129269	Rob	Matney	rob@robmatney.com	6142072799				Marketing contact	2021-02-08 15:26
87629315167	Brian	Pettiford	blpettiford7@gmail.com	4129519673				Marketing contact	2024-12-27 22:00
171915234573	Kelly	Clark	kdc0401@yahoo.com	+19544618125				Marketing contact	2025-11-04 15:34
96951705092	Celiann	Ojeda De Young	celiannojedadeyoung@live.com	+16785716380				Marketing contact	2025-02-04 16:59
73586870359	Imran	Ali	imran.ali@baibombeh.ca	'+12046987786		2025-12-03 19:44		Marketing contact	2024-10-30 11:27
52470093475	Katrina Pratt	Roebuck	katrina.pratt-roebuck@uplifme.com	+12658471045	Katey Dallosto (Deactivated User)	2025-11-13 12:36		Marketing contact	2024-08-27 22:24
168763989	Leah	Garlan	info@drleahgarlan.com	+12159339794				Marketing contact	2021-11-10 12:50
131830798201	Danny	Goates	dangoates@yahoo.com	4798863800				Marketing contact	2025-06-23 13:28
115290399379	Amanda	Crooks	amanda.crooks@lcbhs.net	+16056603898				Marketing contact	2025-04-19 13:21
367416888	SANDI	HERTZBACH	hertzbach@gmail.com	7865103744		2025-08-06 18:09		Marketing contact	2022-12-20 09:28
91500742164	Annemarie	Pucher	annemarie.pucher@isis-papyrus.com	+436644487290				Non-marketing contact	2025-01-14 06:31
97415649819	MARGARET	WEBER	margaret@elitenursingny.com	+15166620304				Marketing contact	2025-02-06 10:30
97961111707	Abby	Peterson	abigail.peterson@equitable.com	+12162949502				Marketing contact	2025-02-08 14:30
87876845225	Estie	Traube	estietraube@gmail.com	3477862945				Marketing contact	2024-12-29 12:01
956650	Michael	Cordray	michael_cordray@hotmail.com	5132596506				Marketing contact	2021-02-03 13:53
104055696974	Jessica	McLaughlin	jmclaughlin78@gmail.com	+61414879101				Marketing contact	2025-03-05 17:53
54514397990	Rocky	Garza	rocky@rockygarza.com	9039449141		2024-11-14 14:00		Marketing contact	2024-09-03 15:12
472697158	Melanie	Meier	melanie@atkinsonteam.ca	+14037952299		2024-12-20 14:35		Marketing contact	2023-10-11 17:05
149219953276	Alleghenies	Ucp	asmith@scalucp.org	(814) 442-8822		2025-10-06 17:32		Marketing contact	2025-08-21 11:51
483338401	Ariana	Pareja	ariana@arianapareja.com	7034981181		2025-11-18 09:30		Marketing contact	2023-11-09 12:43
63038106529	NIELS	DIEPVENS	niels@vensius.be	+32479520636				Marketing contact	2024-09-29 16:19
67586560516	James	Hammermeister	jhammermeister5@gmail.com	+18587508192				Non-marketing contact	2024-10-15 00:23
83767298059	Irina	Nezhdanova	i.nezhdanova@squaregps.com	+18189309585				Marketing contact	2024-12-10 23:27
2102484	Dinna	Voges	dinna@recru2r.com	(831) 722-7400				Marketing contact	2021-02-08 15:26
103144777861	Vicki	James	vicki@clearbenefitsadvisors.com	+15852992199		2025-03-01 20:21		Marketing contact	2025-03-01 20:04
152548811332	Wade	Tuba	wtuba@live.com	+13067309223				Marketing contact	2025-09-02 19:45
2003044	Chuck	Ryan	chuck.ryan@yahoo.com	+17708436933		2025-11-25 19:57		Marketing contact	2021-02-08 14:57
148613199696	James	Huang	jhuang@brcadvisors.com	3106669282				Marketing contact	2025-08-19 17:52
110985100127	Emily	Litten	ralitten@smcps.org	2404961248				Marketing contact	2025-04-02 12:21
27802361439	Daniel G.	Taylor	danielgtaylorwriter@gmail.com	+61423933798	Kristen McMahon	2025-12-05 18:31		Marketing contact	2024-06-06 10:55`;

async function importMembers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const lines = membersData.trim().split('\n');
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const line of lines) {
    const fields = line.split('\t');

    const firstName = fields[1]?.trim();
    const lastName = fields[2]?.trim();
    const email = fields[3]?.trim().toLowerCase();
    const phone = fields[4]?.trim();
    const createDate = fields[9]?.trim();

    if (!email || !email.includes('@')) {
      continue;
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    let joinDate = new Date();
    if (createDate) {
      const parsed = new Date(createDate);
      if (!isNaN(parsed.getTime())) {
        joinDate = parsed;
      }
    }

    let cleanPhone = phone;
    if (cleanPhone) {
      cleanPhone = cleanPhone.replace(/\s+/g, '').replace(/^'+/, '');
    }

    const { error } = await supabase.from('members').insert({
      id: nanoid(),
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      email: email,
      phone: cleanPhone || null,
      membershipTier: 'SUCCESSPlus',
      membershipStatus: 'Active',
      joinDate: joinDate.toISOString(),
      totalSpent: 0,
      lifetimeValue: 0,
      engagementScore: 0,
      createdAt: joinDate.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      console.error(`Error importing ${email}:`, error.message);
      errors++;
    } else {
      console.log(`✓ ${firstName} ${lastName} (${email})`);
      imported++;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Imported: ${imported}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
}

importMembers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
