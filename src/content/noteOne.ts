export interface NoteBookPage {
  paragraphs: readonly string[];
  image?: { src: string; alt: string; width: number; height: number };
}

export const NOTE_ONE_TITLE = 'Nota #1 - A ressalva 🥶';

/** Texto fornecido para a nota; a divisão em páginas preserva a ordem integral. */
export const NOTE_ONE_PAGES: readonly NoteBookPage[] = [
  {
    "paragraphs": [
      "Se está vendo isso, provavelmente já faz um tempo que está olhando a terra prometida de longe kkkk",
      "Já devemos ter seguido nossos próprios caminhos, separados. Provavelmente nunca lerá isso, então não faz diferença a essa altura."
    ]
  },
  {
    "paragraphs": [
      "Nunca tive problemas com seu passado. Eu te aceitei, totalmente. Sempre apreciei mais o arrependimento, fé, humildade e coragem de reconhecer os próprios erros e seguir por um caminho diferente. Acha que não sabia o que já tinha feito?",
      "Fiz o que estava ao meu alcance para conhecer o máximo que podia antes de tentar me aproximar. Nem sempre uso minhas habilidades para o bem, Deus me perdoe 😅"
    ]
  },
  {
    "image": {
      "src": "/assets/note-one-photo.jpg",
      "alt": "Foto anexada à nota, com orelhas de coelha.",
      "width": 625,
      "height": 1280
    },
    "paragraphs": [
      "Claro, não conhecia todos os detalhes, mas não era difícil imaginar olhando os contextos..."
    ]
  },
  {
    "paragraphs": [
      "Mas eu sentia que fazia parte do meu propósito de vida. Errei em brincar com algo que não tinha entendido que te machucava tanto, quando falei que era saliente. Você me chamava de saliente toda vez kkkk afinal, ser só um pouquinho não é ruim, é? Mals, parei."
    ]
  },
  {
    "paragraphs": [
      "A ressalva também era outra piada, mau gosto e falta de sensibilidade, reconheço. Não falei que seu passado era um problema, ou que tinha uma convicção de que minha esposa... escolhi a palavra ressalva, que não é negativa por si só, faria um trocadilho kkkk, mas enfim, não era um momento para descontração."
    ]
  },
  {
    "paragraphs": [
      "No final, meu apego ou ansiedade, sei lá kkkk me fizeram tentar resolver as coisas de forma desesperada. Uma ausência de cuidado pessoal, com a insônia, falta de sol, marcas do passado, etc, só atrapalharam tudo. Triste saber que o que marcou o início do fim de nossa aproximação foi um saliente e uma ressalva, não? Pois é, olha só como a vida é..."
    ]
  },
  {
    "paragraphs": [
      "Nem chegamos a sair, nem um beijinho. Será que idealizamos demais? Chegamos a falar de lua de mel e traumas. Uma intimidade descabida para o momento. Ou será que foi muita fé de que daria certo, daí a antecipação dessas coisas não faria diferença? Não sei."
    ]
  },
  {
    "paragraphs": [
      "Se as conversas virtuais já eram boas, imagina se tivéssemos aprendido a desfrutar mais da presença um do outro, sem inseguranças e ansiedade? Bom, acho que não adianta ficar só imaginando, talvez simplesmente não fosse para ser, ou talvez não fosse a hora. Quem é que sabe, só Deus mesmo."
    ]
  }
];
