"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type Section = {
  heading: string | null;
  paragraphs: string[];
};

// ─── English content ───────────────────────────────────────────────────────────

const EN_DATE = "May 17, 2026";
const EN_TITLE = "Public Statement Regarding Former Staff/Partners";

const EN_SECTIONS: Section[] = [
  {
    heading: null,
    paragraphs: [
      "This statement concerns the conduct of two former members of MoT+++ during their departure from the organization in late 2025, and what a subsequent investigation has uncovered.",
      "Since 2015, MoT+++ has been built on trust, trust between artists, between collaborators, between an organization and the community it serves. We speak now because we owe it to you all, and because silence has allowed a narrative of falsehoods and half-truths to circulate.",
    ],
  },
  {
    heading: "Whom This Concerns",
    paragraphs: [
      "Nguyễn Trà My and Luke Schneider joined MoT+++ a decade ago. They met through our organization, married by the river at our former location, and were given increasing responsibility over time. For many years Trà My was awarded a generous salary for her efforts. With their assurances, Trần Thị Thanh Hà, who founded MoT+++ in 2015, stepped back from day-to-day operations, trusting them to steward what she had built. She remained central to the organization: cultivating the collector relationships, securing the institutional partnerships, and establishing the connections with foundations and partners like the Amanaki Hotel that made MoT+++'s growth possible. She attended every public moment, covered the costs, and consistently praised her team's contributions, proud of what she believed they were building together.",
      "For four years before any formal partnership existed, Hà had already been splitting all revenues with Trà My 50/50. In 2025 this informal arrangement was documented in the company filings, and Trà My was granted formal half partnership in the organization. This was an act of generosity toward someone she considered a long-term partner and friend.",
    ],
  },
  {
    heading: "The Departure and Broken Handover",
    paragraphs: [
      "After Luke and Trà My announced they wanted to leave MoT+++ in September of 2025, they described their plan as wanting 'to start something from scratch,' claiming they were not yet sure what that would be and intended to take many months off first. They were given Hà's blessing and promised to hand the operations of the organization back properly. They set the terms of their own departure and insisted they would handle the transition responsibly. In the 3 months that followed, those promises were consistently broken. Meetings with legal and financial advisors were constantly cancelled and their behavior became erratic. They announced that all other members of the team they had managed were leaving with them, and refused to include Hà in team meetings. Out of respect for years of shared work and friendship, she did not pursue formal action.",
    ],
  },
  {
    heading: "The Forged Filings",
    paragraphs: [
      "When they stopped responding entirely, Hà consulted a lawyer simply to understand what could be done to stabilize MoT+++ given how little had been handed over. What they did hand over was selective, enough to maintain the appearance of good faith, with most actual responsibilities delegated to an intern. It was in the course of that legal review that the first discovery was made, and it was shocking. Four critical company documents had been filed with the Ho Chi Minh City Business Registration Office in November 2025 bearing forged signatures of Hà. These include a company registration application, the company charter, a capital transfer contract, and a power of attorney authorizing a third party, a man Hà has never met, to carry out the registration. Hà categorically did not sign these documents and knew nothing of their existence. The forgery is evident and, if this matter proceeds criminally, will not be difficult to prove, carrying with it severe criminal penalties under Vietnamese law. This filing was made while Trà My and Luke were still in their agreed handover period, still presenting publicly as cooperative partners. It was this discovery that prompted a fuller investigation into the organization's finances, and what that investigation revealed was extensive.",
    ],
  },
  {
    heading: "Undisclosed Self-Payment",
    paragraphs: [
      "Trà My's entitlement was to half of MoT+++'s revenues. Luke Schneider, her husband, was never a formal member of the organization, positioning himself as a volunteer who would handle part of Trà My's responsibilities. Over time he self-appointed the title of director. Through his association with MoT+++, he built a substantial private clientele for his art handling business, deriving considerable professional benefit from the organization's network and relationships. No salary arrangement for either of them beyond Trà My's existing entitlement was ever discussed with or agreed to by Hà, and no contract existed to justify one. Instead, they awarded themselves each three times as much as the rest of the team combined on a monthly basis, presenting these payments in financial documents produced retroactively for grant funding applications that were kept from Hà's eyes.",
    ],
  },
  {
    heading: "Falsified Accounting",
    paragraphs: [
      "Throughout this period, Trà My consistently assured Hà that the organization's finances were healthy and that outstanding obligations, including to the Amanaki Hotel, were being properly met. Those assurances were false. The documents Luke produced to account for all of this bear no resemblance to any recognizable standard of company accounting. They were internally self-contradictory, with revenue sources anonymized, entire transactions omitted, and a salary claim fabricated with no contractual basis. When the inadequacy of the first version became apparent, they produced a revised version, which appeared designed to shift blame and preempt the scrutiny they anticipated.",
    ],
  },
  {
    heading: "Misdirected Revenues and Missing Funds",
    paragraphs: [
      "All company funds, the majority of which came from partner organizations, were withdrawn from the official company account without documentation, accounting, or Hà's knowledge or consent. Virtually all payments from resident artists, collectors, and partners were systematically directed to Trà My's personal bank accounts, bypassing the organization entirely. This included the fees from every self-funded artist in residence at a.Farm during this period, none of which were ever deposited into the company account. At various points Hà raised concerns about irregularities. Each time she was given assurances; each time those assurances proved false. When she explicitly asked for the situation to be corrected, her request was disregarded. A substantial sum in sales remains unaccounted for, with investigation ongoing.",
    ],
  },
  {
    heading: "The Parallel Company",
    paragraphs: [
      "The claim that they intended to 'start something from scratch' is difficult to reconcile with what followed. During the same transition period, Trà My and Luke established a new company operating in the same field as MoT+++, from the same address where late artist Lananh Lê lived, worked, and is understood to have died. Their new venture appears to directly replicate MoT+++'s programs, including artist residency, art sales, and events, using the artist relationships, collector relationships, and institutional partnerships MoT+++ spent years building, all redirected without disclosure or consent. This represents a serious and ongoing harm to the organization's future.",
    ],
  },
  {
    heading: "In Regard to Lananh Lê",
    paragraphs: [
      "Lananh Lê was a beloved artist and a vital part of this community. MoT+++ worked closely with her, defended her from public scrutiny, supported her solo exhibition, and has since her passing been committed to honoring her memory and preserving her work, through documentation, an artist book, and continued advocacy for her legacy.",
      "Among the assets stolen during the transition were 14 artist proof works from Lananh's digital series, seven works with two artist proofs each. These were the personal property of Hà, acquired through years of direct collaboration with Lananh in developing those works. MoT+++, with the agreement of Lananh's father, also represented additional editions of these works for sale as well as her physical works. All of these are now missing. Contracts signed by all parties were not included in the handover and it appears that further forgery may have been employed to leave a false trail.",
      "We have become aware that false and deeply painful claims about Lananh regarding Hà have been spread privately. We will not repeat or amplify them here. We will say only that they are false, that the people who knew Lananh and who worked alongside Hà know the truth, and that exploiting a young artist's death to deflect from one's own conduct is something this community is capable of recognizing for what it is.",
    ],
  },
  {
    heading: "On Hà",
    paragraphs: [
      "Let us be direct: Hà received no salary, no commission, and no income from MoT+++ during the period in question. The claim that she benefited financially while others did the work is the inverse of what the financial records show. Her personal investment in MoT+++ over the past decade equals tens of billions in VND, and through the partnership of her friends and associates, MoT+++ was able to expand and develop the reputation it has today.",
    ],
  },
  {
    heading: "Where Things Stand",
    paragraphs: [
      "We made repeated attempts over many months to resolve this privately, including efforts to bring both parties to the table for direct discussion. They consistently declined to engage. Only after those attempts failed did we seek formal legal counsel. A formal demand was issued with a response deadline of April 17, 2026, covering the forged documents, the unaccounted funds, the missing artworks and contracts, the unpaid hotel debts left in the organization's name, and the failure to hand over company documentation, accounting records, or artist agreements at the end of the handover period. As of this writing, there has been no meaningful response. Soon, formal criminal filing with the relevant authorities will be inevitable.",
    ],
  },
  {
    heading: "To the Community",
    paragraphs: [
      "We also note that the organization's Facebook accounts were never returned as part of the handover. We urge that for the time being you all look to our Instagram and email for communication and updates on future programs and events. If any of you have regular contact with Luke, we ask you to urge him to make this right immediately.",
      "If you have had financial dealings with MoT+++ during the period when Trà My and Luke were managing operations, as a collector, an artist, a partner, a funder, we ask that you reach out to us. Many agreements made during that period lack documentation on our side, and we are working to reconstruct a full picture. We especially ask anyone who has relevant information or direct experience to come forward. We urge all to exercise caution before engaging professionally or personally with these individuals.",
      "For the past six months, MoT+++ has been rebuilding, its program, its values, its relationships with artists and with you. That work is underway, and we look forward to sharing what comes next very soon.",
      "We make this statement out of necessity. This community is built on integrity, and silence in the face of what has happened here would itself be a failure of that integrity. If you have any questions about anything raised here, please do not hesitate to reach out to us directly. Thank you all for your support.",
    ],
  },
];

// ─── Vietnamese content ────────────────────────────────────────────────────────

const VI_DATE = "17 Tháng 5, 2026";
const VI_TITLE = "Tuyên Bố Công Khai Về Cựu Nhân Viên/Đối Tác";

const VI_SECTIONS: Section[] = [
  {
    heading: null,
    paragraphs: [
      "Tuyên bố này liên quan đến hành vi của hai thành viên cũ của MoT+++ trong quá trình họ rời khỏi tổ chức vào cuối năm 2025, và những gì cuộc điều tra sau đó đã phát hiện.",
      "Từ năm 2015, MoT+++ được xây dựng trên nền tảng của sự tin tưởng, tin tưởng giữa các nghệ sĩ, giữa các cộng tác viên, giữa một tổ chức và cộng đồng mà nó phục vụ. Chúng tôi lên tiếng lúc này vì chúng tôi nợ điều đó với tất cả các bạn, và vì sự im lặng đã cho phép một câu chuyện sai lệch và nửa sự thật được lưu truyền.",
    ],
  },
  {
    heading: "Liên Quan Đến Ai",
    paragraphs: [
      "Nguyễn Trà My và Luke Schneider gia nhập MoT+++ một thập kỷ trước. Họ gặp nhau qua tổ chức của chúng tôi, kết hôn bên bờ sông tại địa điểm cũ của chúng tôi, và được trao trách nhiệm ngày càng lớn hơn theo thời gian. Trong nhiều năm, Trà My được trả mức lương hào phóng cho những đóng góp của cô. Với sự đảm bảo của họ, Trần Thị Thanh Hà, người sáng lập MoT+++ vào năm 2015, đã rút lui khỏi các hoạt động hàng ngày, tin tưởng giao phó những gì bà đã xây dựng vào tay họ. Bà vẫn là trung tâm của tổ chức: xây dựng các mối quan hệ với nhà sưu tập, đảm bảo các đối tác tổ chức, và thiết lập các kết nối với các quỹ và đối tác như khách sạn Amanaki — những gì đã tạo nên sự tăng trưởng của MoT+++. Bà có mặt tại mọi sự kiện công khai, chi trả các khoản chi phí, và liên tục ca ngợi đóng góp của nhóm, tự hào về những gì bà tin rằng họ đang cùng nhau xây dựng.",
      "Trong bốn năm trước khi có bất kỳ quan hệ đối tác chính thức nào, Hà đã chia đều doanh thu 50/50 với Trà My. Năm 2025, thỏa thuận không chính thức này được ghi nhận trong hồ sơ công ty, và Trà My được trao quyền đối tác chính thức sở hữu một nửa tổ chức. Đây là một hành động hào phóng đối với người mà bà coi là đối tác và bạn bè lâu năm.",
    ],
  },
  {
    heading: "Sự Ra Đi và Quá Trình Bàn Giao Bị Phá Vỡ",
    paragraphs: [
      "Sau khi Luke và Trà My thông báo muốn rời MoT+++ vào tháng 9 năm 2025, họ mô tả kế hoạch của mình là muốn 'bắt đầu từ đầu,' tuyên bố rằng họ chưa biết điều đó sẽ là gì và dự định nghỉ ngơi nhiều tháng trước. Họ được Hà chúc phúc và hứa sẽ bàn giao lại hoạt động của tổ chức một cách đúng đắn. Họ tự đặt ra các điều khoản cho sự ra đi của mình và khăng khăng rằng họ sẽ xử lý quá trình chuyển giao một cách có trách nhiệm. Trong 3 tháng tiếp theo, những lời hứa đó đã bị vi phạm liên tục. Các cuộc họp với cố vấn pháp lý và tài chính liên tục bị hủy và hành vi của họ trở nên bất thường. Họ thông báo rằng tất cả các thành viên khác trong nhóm họ quản lý sẽ rời đi cùng họ, và từ chối để Hà tham gia các cuộc họp nhóm. Vì tôn trọng nhiều năm cộng tác và tình bạn, bà đã không thực hiện hành động pháp lý chính thức.",
    ],
  },
  {
    heading: "Các Văn Bản Bị Làm Giả",
    paragraphs: [
      "Khi họ hoàn toàn ngừng phản hồi, Hà đã tham khảo ý kiến luật sư chỉ để hiểu có thể làm gì để ổn định MoT+++ trong bối cảnh rất ít được bàn giao. Những gì họ bàn giao là có chọn lọc, đủ để duy trì vẻ ngoài thiện chí, với hầu hết các trách nhiệm thực tế được giao cho một thực tập sinh. Chính trong quá trình xem xét pháp lý đó mà phát hiện đầu tiên được thực hiện, và nó gây chấn động. Bốn văn bản quan trọng của công ty đã được nộp lên Phòng Đăng ký Kinh doanh TP.HCM vào tháng 11 năm 2025 có chữ ký giả mạo của Hà. Bao gồm đơn đăng ký công ty, điều lệ công ty, hợp đồng chuyển nhượng vốn, và giấy ủy quyền cho phép một bên thứ ba, một người mà Hà chưa bao giờ gặp, thực hiện việc đăng ký. Hà hoàn toàn không ký các văn bản này và không hề biết về sự tồn tại của chúng. Việc làm giả là rõ ràng và, nếu vụ việc tiến hành theo hướng hình sự, sẽ không khó để chứng minh, kéo theo hình phạt hình sự nghiêm khắc theo pháp luật Việt Nam. Việc nộp hồ sơ này được thực hiện trong khi Trà My và Luke vẫn đang trong thời gian bàn giao đã thỏa thuận, vẫn đang trình bày trước công chúng như những đối tác hợp tác. Chính phát hiện này đã thúc đẩy một cuộc điều tra toàn diện hơn về tài chính của tổ chức, và những gì cuộc điều tra đó tiết lộ là rất sâu rộng.",
    ],
  },
  {
    heading: "Tự Trả Lương Không Được Công Bố",
    paragraphs: [
      "Quyền lợi của Trà My là được nhận một nửa doanh thu của MoT+++. Luke Schneider, chồng của cô, chưa bao giờ là thành viên chính thức của tổ chức, tự định vị mình như một tình nguyện viên xử lý một phần công việc của Trà My. Theo thời gian, anh ta tự phong chức danh giám đốc. Thông qua mối quan hệ với MoT+++, anh ta đã xây dựng được lượng khách hàng tư nhân đáng kể cho doanh nghiệp vận chuyển tác phẩm nghệ thuật của mình, thu được lợi ích nghề nghiệp đáng kể từ mạng lưới và các mối quan hệ của tổ chức. Không có thỏa thuận lương nào cho bất kỳ ai trong số họ ngoài quyền lợi hiện có của Trà My từng được thảo luận hay đồng ý bởi Hà, và không có hợp đồng nào để biện minh cho điều đó. Thay vào đó, họ tự trả cho mỗi người gấp ba lần tổng lương của phần còn lại của nhóm mỗi tháng, trình bày các khoản thanh toán này trong các tài liệu tài chính được tạo ra hồi tố cho các đơn xin tài trợ mà Hà không được xem.",
    ],
  },
  {
    heading: "Kế Toán Giả Mạo",
    paragraphs: [
      "Trong suốt thời gian này, Trà My liên tục đảm bảo với Hà rằng tài chính của tổ chức đang ổn định và các nghĩa vụ còn tồn đọng, bao gồm với khách sạn Amanaki, đang được thanh toán đúng hạn. Những đảm bảo đó là sai sự thật. Các tài liệu mà Luke sản xuất để giải trình cho tất cả những điều này không có bất kỳ điểm nào giống với tiêu chuẩn kế toán công ty được công nhận. Chúng mâu thuẫn nội tại, với nguồn doanh thu bị ẩn danh, toàn bộ giao dịch bị bỏ sót, và yêu cầu lương được bịa đặt không có cơ sở hợp đồng. Khi sự không đầy đủ của phiên bản đầu tiên trở nên rõ ràng, họ sản xuất một phiên bản sửa đổi, có vẻ được thiết kế để đổ lỗi và ngăn chặn sự giám sát mà họ dự đoán.",
    ],
  },
  {
    heading: "Doanh Thu Bị Chuyển Hướng và Quỹ Bị Mất",
    paragraphs: [
      "Toàn bộ quỹ công ty, phần lớn đến từ các tổ chức đối tác, đã bị rút ra khỏi tài khoản công ty chính thức mà không có tài liệu, kế toán, hay sự hiểu biết hay đồng ý của Hà. Hầu hết tất cả các khoản thanh toán từ nghệ sĩ lưu trú, nhà sưu tập, và đối tác đã bị chuyển hướng có hệ thống vào các tài khoản ngân hàng cá nhân của Trà My, bỏ qua tổ chức hoàn toàn. Điều này bao gồm phí từ mọi nghệ sĩ tự tài trợ tham gia lưu trú tại a.Farm trong giai đoạn này, không có khoản nào trong số đó được gửi vào tài khoản công ty. Tại nhiều thời điểm, Hà đã nêu ra mối lo ngại về các bất thường. Mỗi lần bà được trấn an; mỗi lần những trấn an đó hóa ra là sai. Khi bà yêu cầu rõ ràng để sửa chữa tình hình, yêu cầu của bà bị phớt lờ. Một khoản tiền đáng kể từ doanh thu bán hàng vẫn chưa được giải trình, với cuộc điều tra đang tiếp tục.",
    ],
  },
  {
    heading: "Công Ty Song Song",
    paragraphs: [
      "Tuyên bố rằng họ có ý định 'bắt đầu từ đầu' khó có thể dung hòa với những gì xảy ra sau đó. Trong cùng thời kỳ chuyển giao, Trà My và Luke thành lập một công ty mới hoạt động trong cùng lĩnh vực với MoT+++, từ cùng địa chỉ nơi cố nghệ sĩ Lananh Lê từng sống, làm việc, và được hiểu là đã qua đời. Dự án mới của họ có vẻ sao chép trực tiếp các chương trình của MoT+++, bao gồm lưu trú nghệ sĩ, bán tác phẩm nghệ thuật, và các sự kiện, sử dụng các mối quan hệ nghệ sĩ, nhà sưu tập, và đối tác tổ chức mà MoT+++ đã mất nhiều năm xây dựng, tất cả được chuyển hướng mà không có sự công bố hay đồng ý. Đây là một tổn hại nghiêm trọng và đang diễn ra đối với tương lai của tổ chức.",
    ],
  },
  {
    heading: "Về Lananh Lê",
    paragraphs: [
      "Lananh Lê là một nghệ sĩ được yêu mến và là một phần quan trọng của cộng đồng này. MoT+++ đã làm việc chặt chẽ với cô, bảo vệ cô trước sự chỉ trích công khai, hỗ trợ triển lãm cá nhân của cô, và kể từ khi cô qua đời đã cam kết tôn vinh ký ức và bảo tồn tác phẩm của cô, thông qua tài liệu hóa, một cuốn sách về nghệ sĩ, và tiếp tục vận động cho di sản của cô.",
      "Trong số các tài sản bị đánh cắp trong quá trình chuyển giao là 14 tác phẩm bản in nghệ sĩ từ bộ tác phẩm kỹ thuật số của Lananh, bảy tác phẩm với hai bản in nghệ sĩ mỗi tác phẩm. Đây là tài sản cá nhân của Hà, được tích lũy qua nhiều năm cộng tác trực tiếp với Lananh trong việc phát triển các tác phẩm đó. MoT+++, với sự đồng ý của cha Lananh, cũng đại diện cho các ấn bản bổ sung của những tác phẩm này để bán cũng như các tác phẩm vật lý của cô. Tất cả những điều này hiện đang mất tích. Các hợp đồng được ký bởi tất cả các bên liên quan không được đưa vào quá trình bàn giao và có vẻ như việc làm giả thêm đã được sử dụng để tạo ra một đường mòn giả.",
      "Chúng tôi đã biết rằng những tuyên bố sai lệch và đau lòng về Lananh liên quan đến Hà đã được lan truyền riêng tư. Chúng tôi sẽ không lặp lại hay khuếch đại chúng ở đây. Chúng tôi chỉ nói rằng chúng là sai, rằng những người biết Lananh và làm việc cùng Hà biết sự thật, và rằng việc lợi dụng cái chết của một nghệ sĩ trẻ để đánh lạc hướng khỏi hành vi của chính mình là điều mà cộng đồng này có khả năng nhận ra đó là gì.",
    ],
  },
  {
    heading: "Về Hà",
    paragraphs: [
      "Hãy để chúng tôi nói thẳng: Hà không nhận lương, không nhận hoa hồng, và không có thu nhập từ MoT+++ trong giai đoạn được đề cập. Tuyên bố rằng bà được hưởng lợi tài chính trong khi người khác làm việc là điều ngược lại với những gì hồ sơ tài chính cho thấy. Đầu tư cá nhân của bà vào MoT+++ trong thập kỷ qua tương đương hàng chục tỷ đồng, và thông qua sự hợp tác của bạn bè và cộng sự của bà, MoT+++ đã có thể mở rộng và phát triển danh tiếng như ngày hôm nay.",
    ],
  },
  {
    heading: "Tình Hình Hiện Tại",
    paragraphs: [
      "Chúng tôi đã nhiều lần cố gắng giải quyết việc này một cách riêng tư trong nhiều tháng, bao gồm cả những nỗ lực để đưa cả hai bên đến bàn thảo luận trực tiếp. Họ liên tục từ chối tham gia. Chỉ sau khi những nỗ lực đó thất bại, chúng tôi mới tìm đến tư vấn pháp lý chính thức. Một yêu cầu chính thức đã được phát hành với hạn phản hồi là ngày 17 tháng 4 năm 2026, liên quan đến các văn bản bị làm giả, các khoản tiền không được giải trình, các tác phẩm và hợp đồng bị mất, các khoản nợ khách sạn chưa được thanh toán vẫn đứng tên tổ chức, và việc không bàn giao tài liệu công ty, sổ sách kế toán, hay các thỏa thuận với nghệ sĩ vào cuối thời kỳ bàn giao. Tính đến thời điểm viết tuyên bố này, không có phản hồi đáng kể nào. Trong thời gian sắp tới, việc nộp đơn tố cáo hình sự lên các cơ quan có thẩm quyền sẽ là không tránh khỏi.",
    ],
  },
  {
    heading: "Gửi Cộng Đồng",
    paragraphs: [
      "Chúng tôi cũng lưu ý rằng các tài khoản Facebook của tổ chức chưa bao giờ được trả lại như một phần của việc bàn giao. Chúng tôi đề nghị rằng trong thời gian này, các bạn vui lòng theo dõi Instagram và email của chúng tôi để cập nhật về các chương trình và sự kiện sắp tới. Nếu bất kỳ ai trong các bạn có liên lạc thường xuyên với Luke, chúng tôi xin nhờ các bạn thúc giục anh ấy sửa chữa việc này ngay lập tức.",
      "Nếu các bạn từng có giao dịch tài chính với MoT+++ trong giai đoạn Trà My và Luke đang quản lý điều hành, với tư cách là nhà sưu tập, nghệ sĩ, đối tác, hay nhà tài trợ, chúng tôi mong các bạn liên hệ với chúng tôi. Nhiều thỏa thuận được thực hiện trong giai đoạn đó thiếu chứng từ về phía chúng tôi, và chúng tôi đang nỗ lực dựng lại một bức tranh đầy đủ. Chúng tôi đặc biệt mong những ai có thông tin hoặc trải nghiệm trực tiếp liên quan sẽ lên tiếng. Chúng tôi đề nghị tất cả mọi người hãy cẩn trọng trước khi tham gia hợp tác về mặt nghề nghiệp hay cá nhân với các cá nhân này.",
      "Trong sáu tháng qua, MoT+++ đã và đang được xây dựng lại, chương trình của nó, các giá trị của nó, các mối quan hệ của nó với các nghệ sĩ và với các bạn. Công việc đó đang được tiến hành, và chúng tôi mong sớm được chia sẻ những gì sẽ đến tiếp theo.",
      "Chúng tôi đưa ra tuyên bố này vì sự cần thiết. Cộng đồng này được xây dựng trên nền tảng của sự chính trực, và việc im lặng trước những điều đã xảy ra ở đây tự nó sẽ là một thất bại của chính sự chính trực đó. Nếu các bạn có bất kỳ câu hỏi nào về bất cứ điều gì được nêu ở đây, xin đừng ngần ngại liên hệ trực tiếp với chúng tôi. Cảm ơn tất cả các bạn vì sự ủng hộ.",
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatementClient() {
  const [lang, setLang] = useState<"en" | "vi">("en");

  // Add body class so CSS can suppress site header, mobile nav row, footer
  useEffect(() => {
    document.body.classList.add("statement-page");
    return () => document.body.classList.remove("statement-page");
  }, []);

  const date = lang === "en" ? EN_DATE : VI_DATE;
  const title = lang === "en" ? EN_TITLE : VI_TITLE;
  const sections = lang === "en" ? EN_SECTIONS : VI_SECTIONS;

  return (
    <>
      {/* Suppress site header / footer / mobile nav for this page only */}
      <style>{`
        .statement-page > header,
        .statement-page > footer,
        .statement-page .mobile-nav-row,
        .statement-page .header-spacer {
          display: none !important;
        }
      `}</style>

      {/* Minimal logo-only header with EN/VI toggle */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          height: "60px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <Link href="/museum" style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/motpluspluspluslogo-thin.png"
            alt="MoT+++"
            width={160}
            height={36}
            style={{ objectFit: "contain", objectPosition: "left" }}
            unoptimized
          />
        </Link>

        {/* EN / VI toggle */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={() => setLang("en")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "11px",
              letterSpacing: "0.08em",
              color: "#111111",
              opacity: lang === "en" ? 1 : 0.4,
              fontFamily: "inherit",
              transition: "opacity 0.2s",
            }}
          >
            EN
          </button>
          <span
            style={{
              fontSize: "11px",
              color: "#aaaaaa",
              margin: "0 7px",
              userSelect: "none",
            }}
          >
            /
          </span>
          <button
            onClick={() => setLang("vi")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "11px",
              letterSpacing: "0.08em",
              color: "#111111",
              opacity: lang === "vi" ? 1 : 0.4,
              fontFamily: "inherit",
              transition: "opacity 0.2s",
            }}
          >
            VI
          </button>
        </div>
      </div>

      {/* Header spacer (replaces suppressed .header-spacer) */}
      <div style={{ height: "60px" }} />

      {/* Page content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px 120px" }}>
        <div style={{ maxWidth: "680px" }}>

          {/* Date */}
          <p
            style={{
              fontSize: "11px",
              color: "#aaaaaa",
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            {date}
          </p>

          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(22px, 2.8vw, 34px)",
              fontWeight: 300,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "#111111",
              marginBottom: "48px",
            }}
          >
            {title}
          </h1>

          {/* Sections */}
          {sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "#999999",
                    letterSpacing: "0.08em",
                    marginTop: "52px",
                    marginBottom: "18px",
                  }}
                >
                  {section.heading}
                </p>
              )}
              {section.paragraphs.map((text, j) => (
                <p
                  key={j}
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.85,
                    color: "#444444",
                    marginBottom: "20px",
                  }}
                >
                  {text}
                </p>
              ))}
            </div>
          ))}

          {/* Sign-off */}
          <p
            style={{
              fontSize: "15px",
              fontWeight: 300,
              color: "#111111",
              marginTop: "64px",
              marginBottom: 0,
            }}
          >
            — MoT+++
          </p>

        </div>
      </div>
    </>
  );
}
