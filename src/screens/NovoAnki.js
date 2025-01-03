import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebase"; // Certifique-se de que o Firebase está configurado corretamente
// import "./FlashCards.css";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


const NovoAnki = () => {
    const [pergunta, setPergunta] = useState("");
    const [resposta, setResposta] = useState("");
    const [imagemResposta, setImagemResposta] = useState(null);
    const [tempoParaMostrarResposta, setTempoParaMostrarResposta] = useState("");
    const [tempoExibindoResposta, setTempoExibindoResposta] = useState("");
    const [colecao, setColecao] = useState("");
    const [colecoesDisponiveis, setColecoesDisponiveis] = useState([]);

    useEffect(() => {
        carregarColecoes();
        carregarFlashCards();
    }, []);

    const carregarColecoes = async () => {
        try {
            const colecoesSnapshot = await db.collection("colecoes").get();
            const colecoes = colecoesSnapshot.docs.map(doc => doc.data().nome);
            setColecoesDisponiveis(colecoes);
        } catch (error) {
            console.error("Erro ao carregar coleções:", error);
        }
    };

    const salvarColecaoNoFirebase = async (novaColecao) => {
        try {
            await db.collection("colecoes").add({ nome: novaColecao });
            setColecoesDisponiveis((prev) => [...prev, novaColecao]);
        } catch (error) {
            console.error("Erro ao salvar coleção no Firebase:", error);
        }
    };

    const uploadAudio = async (file) => {
        try {
            const storageRef = ref(storage, `audios/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Erro ao fazer upload do áudio:", error);
            return null;
        }
    };


    const adicionarFlashCard = async () => {
        try {
            const imagemPerguntaUrl = perguntaImagem ? await uploadImagem(perguntaImagem) : null;
            const imagemRespostaUrl = imagemResposta ? await uploadImagem(imagemResposta) : null;
            const audioPerguntaUrl = audioPergunta ? await uploadAudio(audioPergunta) : null;

            const novoFlashCard = {
                perguntaImagem: imagemPerguntaUrl,
                pergunta,
                audioPergunta: audioPerguntaUrl,  // Salvar a URL do áudio
                resposta,
                imagemResposta: imagemRespostaUrl,
                tempoParaMostrarResposta,
                tempoExibindoResposta,
                colecao,
            };

            await db.collection("flashCardTexto").add(novoFlashCard);
            setConteudoFlashCards((prev) => [...prev, novoFlashCard]);

            // Limpar campos
            setPergunta("");
            setResposta("");
            setImagemResposta(null);
            setTempoParaMostrarResposta("");
            setTempoExibindoResposta("");
            setColecao("");
            setAudioPergunta(null);  // Limpar o estado do áudio
        } catch (error) {
            console.error("Erro ao adicionar FlashCard:", error);
        }
    };


    const uploadImagem = async (file) => {
        try {
            const storageRef = ref(storage, `images/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            return null;
        }
    };


    const filtrarPorColecao = (nomeColecao) => {
        if (!nomeColecao) {
            carregarFlashCards();
        } else {
            const flashCardsFiltrados = conteudoFlashCards.filter(card => card.colecao === nomeColecao);
            setConteudoFlashCards(flashCardsFiltrados);
        }
    };

    const [conteudoFlashCards, setConteudoFlashCards] = useState([]);
    const [colecaoSelecionada, setColecaoSelecionada] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [showingQuestion, setShowingQuestion] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        carregarFlashCards();
    }, []);

    useEffect(() => {
        if (isPlaying && colecaoSelecionada) {
            const cardAtual = conteudoFlashCards[currentCardIndex];
            if (!cardAtual) return;

            const tempo = showingQuestion
                ? cardAtual.tempoParaMostrarResposta
                : cardAtual.tempoExibindoResposta;

            const timer = setTimeout(() => {
                if (showingQuestion) {
                    setShowingQuestion(false);
                } else {
                    if (currentCardIndex < conteudoFlashCards.length - 1) {
                        setCurrentCardIndex((prev) => prev + 1);
                        setShowingQuestion(true);
                    } else {
                        // Fim da coleção
                        setIsPlaying(false);
                        setColecaoSelecionada(null);
                    }
                }
            }, tempo);

            return () => clearTimeout(timer);
        }
    }, [isPlaying, currentCardIndex, showingQuestion, conteudoFlashCards, colecaoSelecionada]);

    const carregarFlashCards = async () => {
        try {
            const flashCardsSnapshot = await db.collection("flashCardTexto").get();
            const flashCards = flashCardsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setConteudoFlashCards(flashCards);
        } catch (error) {
            console.error("Erro ao carregar flashcards:", error);
        }
    };

    const iniciarColecao = (colecao) => {
        // Filtra os flashcards pela coleção
        const flashCardsFiltrados = conteudoFlashCards.filter((card) => card.colecao === colecao);

        // Embaralha os flashcards
        const flashCardsAleatorios = shuffle(flashCardsFiltrados);

        // Atualiza o estado com os flashcards embaralhados
        setConteudoFlashCards(flashCardsAleatorios);
        setColecaoSelecionada(colecao);
        setCurrentCardIndex(0);
        setShowingQuestion(true);
        setIsPlaying(true);
    };

    // Função para embaralhar o array
    const shuffle = (array) => {
        let i = array.length, j, temp;
        while (i !== 0) {
            j = Math.floor(Math.random() * i);
            i -= 1;
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };


    const [perguntaImagem, setPerguntaImagem] = useState(null);

    const [flashCardEditando, setFlashCardEditando] = useState(null);
    const carregarFlashCardParaEdicao = (flashCard) => {
        setPergunta(flashCard.pergunta);
        setResposta(flashCard.resposta);
        setImagemResposta(null); // Aqui você pode tratar imagens, se necessário
        setTempoParaMostrarResposta(flashCard.tempoParaMostrarResposta);
        setTempoExibindoResposta(flashCard.tempoExibindoResposta);
        setColecao(flashCard.colecao);
        setFlashCardEditando(flashCard);
    };

    const salvarFlashCardEditado = async () => {
        try {
            const imagemRespostaUrl = imagemResposta ? await uploadImagem(imagemResposta) : flashCardEditando.imagemResposta;

            const flashCardAtualizado = {
                pergunta,
                resposta,
                imagemResposta: imagemRespostaUrl,
                tempoParaMostrarResposta,
                tempoExibindoResposta,
                colecao,
            };

            // Atualiza o flashcard no Firebase
            await db.collection("flashCardTexto").doc(flashCardEditando.id).update(flashCardAtualizado);

            // Atualiza o estado local com o flashcard editado
            setConteudoFlashCards((prev) =>
                prev.map((card) => (card.id === flashCardEditando.id ? { ...card, ...flashCardAtualizado } : card))
            );

            // Limpa os campos e o estado de edição
            setPergunta("");
            setResposta("");
            setImagemResposta(null);
            setTempoParaMostrarResposta("");
            setTempoExibindoResposta("");
            setColecao("");
            setFlashCardEditando(null);
        } catch (error) {
            console.error("Erro ao salvar FlashCard editado:", error);
        }
    };
    function getDynamicFontSize(text) {
        if (!text) return "24px"; // Tamanho padrão caso o texto seja vazio

        const length = text.length;

        if (length === 2) {
            return "590px"; // Texto com exatamente 2 caracteres
        } else if (length <= 20) {
            return "100px"; // Texto pequeno
        } else if (length <= 50) {
            return "80px"; // Texto médio
        } else if (length <= 100) {
            return "60px"; // Texto grande
        } else {
            return "40px"; // Texto muito grande
        }
    }



    const [audioPergunta, setAudioPergunta] = useState(null);


    return (
        <div className="container mt-4">
            <h1>Gerenciador de FlashCards</h1>

            <div className="mb-3">
                <label htmlFor="pergunta" className="form-label">Pergunta:</label>
                <input
                    id="pergunta"
                    type="text"
                    className="form-control"
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="imagemPergunta" className="form-label">Imagem para a Pergunta (opcional):</label>
                <input
                    id="imagemPergunta"
                    type="file"
                    className="form-control"
                    onChange={(e) => setPerguntaImagem(e.target.files[0])}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="audioPergunta" className="form-label">Áudio para a Pergunta (opcional):</label>
                <input
                    id="audioPergunta"
                    type="file"
                    className="form-control"
                    onChange={(e) => setAudioPergunta(e.target.files[0])}
                />
            </div>


            <div className="mb-3">
                <label htmlFor="resposta" className="form-label">Resposta:</label>
                <input
                    id="resposta"
                    type="text"
                    className="form-control"
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="imagemResposta" className="form-label">Imagem (opcional):</label>
                <input
                    id="imagemResposta"
                    type="file"
                    className="form-control"
                    onChange={(e) => setImagemResposta(e.target.files[0])}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="tempoParaMostrarResposta" className="form-label">Tempo para mostrar resposta (segundos):</label>
                <input
                    id="tempoParaMostrarResposta"
                    type="number"
                    className="form-control"
                    value={tempoParaMostrarResposta}
                    onChange={(e) => setTempoParaMostrarResposta(e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="tempoExibindoResposta" className="form-label">Tempo exibindo resposta (segundos):</label>
                <input
                    id="tempoExibindoResposta"
                    type="number"
                    className="form-control"
                    value={tempoExibindoResposta}
                    onChange={(e) => setTempoExibindoResposta(e.target.value)}
                />
            </div>

            <div className="mb-3">
                <label htmlFor="colecao" className="form-label">Coleção:</label>
                <select
                    id="colecao"
                    className="form-control"
                    value={colecao}
                    onChange={(e) => setColecao(e.target.value)}
                >
                    <option value="">Selecione uma coleção</option>
                    {colecoesDisponiveis.map((nome, index) => (
                        <option key={index} value={nome}>{nome}</option>
                    ))}
                </select>
                <button
                    className="btn btn-link mt-2"
                    onClick={() => {
                        const novaColecao = prompt("Digite o nome da nova coleção:");
                        if (novaColecao) {
                            salvarColecaoNoFirebase(novaColecao);
                            setColecao(novaColecao);
                        }
                    }}
                >
                    Criar Nova Coleção
                </button>
            </div>

            <button
                className="btn btn-primary"
                onClick={flashCardEditando ? salvarFlashCardEditado : adicionarFlashCard}
            >
                {flashCardEditando ? "Salvar Edição" : "Adicionar FlashCard"}
            </button>


            <hr />

            <div className="mb-3">
                <label htmlFor="filtroColecao" className="form-label">Filtrar por Coleção:</label>
                <select
                    id="filtroColecao"
                    className="form-control"
                    onChange={(e) => filtrarPorColecao(e.target.value)}
                >
                    <option value="">Todas as Coleções</option>
                    {colecoesDisponiveis.map((nome, index) => (
                        <option key={index} value={nome}>{nome}</option>
                    ))}
                </select>
            </div>

            <div className="container mt-4">
                <h1>FlashCards</h1>

                {colecaoSelecionada && isPlaying ? (
                    <div
                        className="fullscreen-overlay"
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            zIndex: 1000,
                        }}
                    >
                        {showingQuestion ? (
                            <>
                                <p
                                    style={{
                                        fontSize: getDynamicFontSize(
                                            conteudoFlashCards[currentCardIndex]?.pergunta
                                        ),
                                    }}
                                >
                                    {conteudoFlashCards[currentCardIndex]?.pergunta}
                                </p>
                                <audio controls autoPlay>
                                    <source
                                        src={conteudoFlashCards[currentCardIndex]?.audioPergunta}
                                        type="audio/mpeg"
                                    />
                                    Seu navegador não suporta o elemento de áudio.
                                </audio>
                                {conteudoFlashCards[currentCardIndex]?.perguntaImagem && (
                                    <img
                                        src={conteudoFlashCards[currentCardIndex]?.perguntaImagem}
                                        alt="Imagem da Pergunta"
                                        style={{ marginTop: "10px", width: "95%", position: 'absolute', zIndex: 1 }}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <p
                                    style={{
                                        fontSize: getDynamicFontSize(
                                            conteudoFlashCards[currentCardIndex]?.resposta
                                        ),
                                    }}
                                >
                                    {conteudoFlashCards[currentCardIndex]?.resposta}
                                </p>
                                {conteudoFlashCards[currentCardIndex]?.imagemResposta && (
                                    <img
                                        src={conteudoFlashCards[currentCardIndex]?.imagemResposta}
                                        alt="Imagem da Resposta"
                                        style={{ marginTop: "10px", width: "95%", position: 'absolute', zIndex: 1 }}
                                    />
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        <h2>FlashCards Disponíveis</h2>
                        {conteudoFlashCards.map((card, index) => (
                            <div key={index} className="card mt-3">
                                <div className="card-body">
                                    <h5 className="card-title">{card.pergunta}</h5>
                                    {card.audioPergunta && (
                                        <audio controls>
                                            <source src={card.audioPergunta} type="audio/mpeg" />
                                            Seu navegador não suporta o elemento de áudio.
                                        </audio>
                                    )}
                                    <p className="card-text">{card.resposta}</p>
                                    {card.imagemResposta && (
                                        <img
                                            src={card.imagemResposta}
                                            alt="Imagem da Resposta"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "200px",
                                                marginTop: "10px",
                                            }}
                                        />
                                    )}
                                    <p
                                        className="card-text"
                                        onClick={() => iniciarColecao(card.colecao)}
                                        style={{ cursor: "pointer", color: "blue" }}
                                    >
                                        <strong>Coleção:</strong> {card.colecao}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    );
};

export default NovoAnki;
