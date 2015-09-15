$(document).ready(function(){
// объявляем шаблоны

var re_bgn       = /^\\begin\{([^\{\}]+)\}(\{(.+)\})?/;                               		// начало блока            +
var re_bgb       = /^\\begin\{thebibliography\}(\{(.+)\})?/;                               	// начало библиографии     +
var re_end       = /^\\end\{([a-zA-Z0-9]+)\}/gim;                                     		// конец блока             +
var re_dcl       = /^\\documentclass\{([^\{\}]+)\}/;                                 		// начало документа        +     
var re_com       = /%(.*)$/;                                                         		// комментарии             +
var re_stp       = /\^([^(,\s+)(\.\\s+)])/;                                          		// степень                 +
var re_spc       = /\s+/gim;                                                         		// пробелы                 +
var re_def       = /\\def\\([a-zA-Z]+)\{([^\}]+)\}/g;                                		// определение комманды    +
var re_frm       = /\$([^\$]+)\$/g;                                                   		// формула                 +
var re_f_c       = /\$\$([^\$]+)\$\$/g;                                               		// формула в центре        +
var re_tld       = /(~)/gim;                                                          		// тильда = пробел         +
var re_tir       = /(---+)/gim;                                                       		// тире                    +
var re_mgt       = /[^a-zA-Z](dots)[^a-zA-Z]/gim;                                     		// моготочие               +
var re_b_p       = /\\bibitem\{([a-zA-Z0-9]+)\}([^\\]*)/g;                                  // пункт библиографии      +
var re_buk       = /([a-zA-Z0-9а-яА-Я]+)/g;
var re_b_v       = /\\cite\[([^\[\]\{\}]+)\]\{(([a-zA-Z0-9]+)(,\s?[a-zA-Z0-9]+)*)\}/gim;    // вызов библиографии c[]  +
var re_b_s       = /\\cite\{(([a-zA-Zа-яА-Я0-9\s]+)(,\s?[a-zA-Z0-9]+)*)\}/gim;              // вызов библиографии без[]+
var re_n_s       = /^[\n\f\r\s\t\0]+$/g;                                                    // непечатные символы      +


var arr_def=[new Array];                                    // массив под самописные команды
var arr_d_i=0;                                         
var arr_bib=[];                                             // массив под билиографию
var arr_b_i=0;
var arr_p_b=[];                                             // массив под пункт списка литературы
var arr_p_i=0;
var html="";                                                // вывод результата
var temp_string;                                            // обрабатываемая строка
var f_p=0;                                                  // флаг начала абзаца
var f_err=0;                                                // флаг ошибки

var example="\\documentclass{article}\n"+                   // пример синтаксиса ТеХа
"\\begin{example}\n"+
"Привет, мир!\n"+
"\n"+
"\\def\\ton{1,2,\\dots,n}\n"+
"Пусть $i=\\ton$ и $j=\\ton$, тогда у нас получается что что-то где-то как-то вычисляется. Таким образом, можно сделать вывод или ввод, в зависимости от ситуации. Кроме того следует учитывать, что существует много обстоятельств, которые могут повлиять на результат тем или иным образом.\n"+
"\n"+
"Необходимость вычислений, с использованием формул, стоит перед человечеством уже давно. Как известно, тут есть формула $$E=mc^2$$, которая появилась сами знаете как. Она очень полезна и полна сакрального смысла, который откроется лишь избранному. Для того чтобы воспользоваться всей мощью данной формулы, необходима лунная призма.\n"+
"\n"+
"Всю необходимую информацию по данной ситуации, которая может потребоваться, можно отыскать в книгах~\\cite{knuth93texbook,lvovsky94latex}, % это комментарий\n"+
"особенно в~\\cite[стр.~34]{lvovsky94latex}, которые как известно, хранятся в библиотеке.\n"+
"\n"+
"\n"+
"$$a+b=c/d$$                    %это тоже комментакрий\n"+
"\\begin{thebibliography}{0}\n"+
 "\n"+  
    "\\bibitem{knuth93texbook}Кнут~Д. \n"+
     "Всё про тыр-пыр-пыр.\n"+
     "--- Протвино, Издательский дом \"СырокДружба\", 1993.\n"+      
    "\\bibitem{lvovsky94latex} Львовский~С.М.\n"+
     "Набор и вёрстка в пакете из-под колбасы.\n"+
    " --- М., Космосинформ, 1994.\n"+     
"\\end{thebibliography}\n"+
"\\end{example}";

 $('#go').click(function(){                       // преобразование текста
    var source=$(".cont").val();  
f_err=0;
  // проверка синтаксиса
  var re_er_sk1 = /[^\\]\{/gi;              // { без /
  var re_er_sk2 = /[^\\]\}/gi;              // } без /
  var re_er_dl1 = /[^\$]\$[^\$]/gi;         // $
  var re_er_dl2 = /[^\$]\$\$[^\$]/gi;       // $$
  var re_er_bg = /\\begin/gi;              // \begin
  var re_er_en = /\\end/gi;                // \end
  
  matches_sk1=source.match(re_er_sk1);
  matches_sk2=source.match(re_er_sk2);
  if(matches_sk1.length!=matches_sk2.length)
   {
   alert("[ERROR]: Пропущена фигурная скобка");
   f_err=1;
   }
  if(source.match(re_er_dl1).length%2!=0)
   {
   alert("[ERROR]: Пропущен одиночный доллар."); 
   f_err=1;
   }
  if(source.match(re_er_dl2).length%2!=0)
   {
   alert("[ERROR]: Пропущен двойной доллар."); 
   f_err=1;
   }    
  if(source.match(re_er_bg).length!=source.match(re_er_en).length)
   {
   alert("[ERROR]: Незавершенная пара begin-end.");
   f_err=1;
   }
	
//	разбиваем текст на строки
    string=source.split("\n");                    // разбиение необходимо если исходный текст слишком велик
//  обрабатываем построчно
//alert(f_err);
	for(i=0;(string[i]||string[i]=="\n"||string[i]=="")&&f_err==0;i++)
	 { 
	 temp_string=string[i];                       // работаем с этой строкой
	 
	
	 temp_string=temp_string.replace(/(.+)\n/, "$1");                                        // замена тильд на неразрывный пробел
	 temp_string=temp_string.replace(re_tld, "&nbsp;");                                      // замена тильд на неразрывный пробел
	 temp_string=temp_string.replace(re_tir, "&mdash;");                                     // ---
	 temp_string=temp_string.replace(re_mgt, "&hellip;");								     // ...
	 temp_string=temp_string.replace(re_com, "");                                            // %
	 temp_string=temp_string.replace(re_f_c, "<span class='div' align=center><b><i>$1</i></b></span>");    // формула по центру              
	 temp_string=temp_string.replace(re_frm, "<b><i> $1 </i></b>");                          // формула                                	 
	 temp_string=temp_string.replace(re_stp, "<sup>$1</sup>");                               // степень 
	 
	 //// определение команд         
	 if(temp_string.search(re_def)!=-1)  // если в строке есть что-то похожее
	  {
	  //alert("нашли новую команду");
	  arr_def[arr_d_i][0]=temp_string.replace(re_def, '\\'+"$1");  // заносим в индекс массива название команды
	  arr_def[arr_d_i][1]=temp_string.replace(re_def, "$2");       // тело команды
	  temp_string=temp_string.replace(re_def,"");
	  
	  arr_d_i++;
	  }
	 for(u=0;u<arr_d_i;u++)
      {
	  re_arr_d = new RegExp("\\"+arr_def[u][0], 'g');             // проверяем, естль ли в строке новые команды       
	  temp_string=temp_string.replace(re_arr_d, arr_def[u][1]);   // если есть, заменяем на их значение
	  }	
	  
     temp_string=temp_string.replace(re_bgb, "<p class=\"$1\"><h3>Список литературы:</h3>"); // начало библиографии
	 temp_string=temp_string.replace(re_bgn, "<p class=\"$1\">");                            // начало блока
	 temp_string=temp_string.replace(re_end, "</p>");                                        // конец  блока		 
	 temp_string=temp_string.replace(re_dcl, "");                                            // начало документа

     // библиография 
	 
	 ////////////////////////
	 if(found = temp_string.match(re_b_v))                                                // если есть вызов с []
	 {
     for(j=0;found[j];j++)
	  {
	  j1=j+1
	  temp_string=temp_string.replace(re_b_v, "[$2, $1]");                                // заменяем на [...]
	  found[j]=found[j].replace(re_b_v, "$2");                                            // массив с порядновым номером и названием книги
	  found2 = found[j].match(re_buk);
	  for(t=0;found2[t];t++)
	   {
	   f_bib=0; // флаг наличия в массиве
	   for(y=1;(y<=arr_b_i||arr_b_i==0)&&y<20;y++)
	    {
		//alert(y);
		if(arr_bib[y]==found2[t])
		 {
		 f_bib=1;
		 break;
		 }
		}
	    if(f_bib==0)
         {
		 arr_b_i++;
		 arr_bib[arr_b_i]=found2[t];
		 }		
	   }
	   
	  }
	  for(y=1;y<=arr_b_i;y++)
	    {
        re_arr_b = new RegExp(arr_bib[y], 'g');               // пункт библиографии
		temp_string=temp_string.replace(re_arr_b, "<a href='#bib"+y+"'>"+y+"</a>");
		}
    }
	
	
	 ////////////////////////
	 if(found = temp_string.match(re_b_s))                                                // если вызов без []
	 {
     for(j=0;found[j];j++)
	  {
	  j1=j+1;
	  temp_string=temp_string.replace(re_b_s, "[$1]");                                     
      found[j]=found[j].replace(re_b_s, "$1");
	   found2 = found[j].match(re_buk);
	  for(t=0;found2[t];t++)
	   {
	    f_bib=0; // флаг наличия в массиве
	   for(y=1;(y<=arr_b_i||arr_b_i==0)&&y<20;y++)
	    {
		if(arr_bib[y]==found2[t])
		 {
		 f_bib=1;
		 break;
		 }
		}
	    if(f_bib==0)
         {
		 arr_b_i++;
		 arr_bib[arr_b_i]=found2[t];
		 }		
	   }
	   
	  }
	  for(y=1;y<=arr_b_i;y++)
	    {
        re_arr_b = new RegExp(arr_bib[y], 'g');                                              // пункт библиографии
		temp_string=temp_string.replace(re_arr_b, "<a href='#bib"+y+"'>"+y+"</a>");
		}
    }
	 ////////////////////////
	 
	 
	
	// список литературы
	temp_string=temp_string.replace(re_b_p, "$1 $2");       
	for(y=1;y<=arr_b_i;y++)
	    {
		re_arr_b = new RegExp(arr_bib[y]+"([\n])?", 'g');                                    // пункт библиографии
		temp_string=temp_string.replace(re_arr_b, "<br><a name='bib"+y+"'></a>["+y+"] ");
       // arr_p_b[arr_p_i]=temp_string.replace(re_arr_b, "<br><a name='bib"+y+"'></a>["+y+"] ");	
		}
	
	 temp_string=temp_string.replace(re_spc, " ");                                           // замена много пробелов на мало	
	 	 
	 if(temp_string=="\n"||temp_string.lengh<1||re_n_s.test(temp_string)||!temp_string)      // пытаемся разбить на параграфы
	  {
	  // alert(temp_string+" = 0");
	  switch(f_p)
	   {
	   case 0:
	    f_p=0;
		break;
	   case 1:
	    temp_string="</p>\n";
	    f_p=0;
		break;
	   }
	 // alert("-"+temp_string+"- = new"); 
	  }
	 else
	  {
	// alert("-"+temp_string+"- = 1");
	  switch(f_p)
	   {
	   case 0:
	    temp_string="<p>"+temp_string;
	    f_p=1;
		break;
	   case 1:
	   	break;
	   }
	 // alert("-"+temp_string+"- = new"); 
	  }
	 
	 if(temp_string)                               // если строчка нам нравится, добавляем к результату
	  html+=temp_string;
	 }// конец обработки строки
	 
	 // вставка результата
	 $("#tex_result").empty().html(html);
 });
 
 $("#example").click(function(){
  $("#tex_source").val(example);
 });
$("#clear").click(function(){
  $("#tex_source").val("");
 });
$("#renew").click(function(){
  $("#tex_result").html("");
 }); 
});