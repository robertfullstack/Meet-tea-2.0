import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from '../firebase.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import '../styles/logincadastro.css';
import IconSoloMeetTEA from '../icons/icon-solo-meet-tea.png';

const LoginRegistro = (props) => {
    const [containerLogar, setContainerLogar] = useState(true);
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const navigate = useNavigate();

    const criarConta = (e) => {
        e.preventDefault();

        // Verifica se a caixa de seleção foi marcada
        if (!aceitouTermos) {
            toast.error('Você precisa aceitar os termos para criar uma conta.');
            return;
        }

        let email = document.getElementById("email-cadastro").value;
        let password = document.getElementById("password-cadastro").value;
        let userName = document.getElementById("userName-cadastro").value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((authUser) => {
                toast.success("Conta criada com Sucesso!");
                authUser.user.updateProfile({
                    displayName: userName
                });
            }).catch((error) => toast.error('Erro ao criar uma conta: ' + error.message));
    }

    const logar = (e) => {
        e.preventDefault();

        let email = document.getElementById("email-login").value;
        let password = document.getElementById("password-login").value;

        auth.signInWithEmailAndPassword(email, password).then((auth) => {
            props.setUser(auth.user.displayName);
            toast.success('Logado com Sucesso!');
            navigate('/home');
        }).catch((error) => toast.error('Erro ao logar: ' + error.message));
    }

    const enviarEmailRedefinicaoSenha = (e) => {
        e.preventDefault();

        auth.sendPasswordResetEmail(resetEmail)
            .then(() => {
                toast.success('E-mail de redefinição de senha enviado!');
                setShowResetPassword(false);
            })
            .catch((error) => toast.error('Erro ao enviar e-mail de redefinição de senha: ' + error.message));
    }

    return (
        <div className="App">
            <div className="main">
                {containerLogar ?
                    <div className="main-container-login">
                        <h1 style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={IconSoloMeetTEA} width={40} style={{ margin: '0 10px' }} />MEET TEA <img style={{ margin: '0 10px' }} src={IconSoloMeetTEA} width={40} />
                        </h1>
                        <input type="email" placeholder="User@gmail.com" id="email-login" />
                        <input type="password" id="password-login" placeholder="Senha" />
                        <button onClick={(e) => logar(e)}>Iniciar Sessão</button>
                        <p onClick={() => setShowResetPassword(true)} style={{ cursor: 'pointer', color: 'blue' }}>Esqueci a senha</p>
                        <p>Não tem uma Conta? <span onClick={() => setContainerLogar(!containerLogar)}>Registrar-se</span></p>
                    </div>
                    :
                    <div className="main-container-registro">
                        <h1 style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={IconSoloMeetTEA} width={40} style={{ margin: '0 10px' }} />MEET TEA <img src={IconSoloMeetTEA} width={40} style={{ margin: '0 10px' }} />
                        </h1>
                        <input type="email" placeholder="User@gmail.com" id="email-cadastro" />
                        <input type="password" id="password-cadastro" placeholder="Senha" />
                        <input type="text" id="userName-cadastro" placeholder="Nome de usuário" />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                id="aceitou-termos"
                                checked={aceitouTermos}
                                onChange={(e) => setAceitouTermos(e.target.checked)}
                            />
                            <label htmlFor="aceitou-termos">
                                Ao submeter esse formulário, declaro que li e entendi que o tratamento de dados pessoais será realizado nos termos da Política de Privacidade do Senac São Paulo
                            </label>
                        </div>
                        <button onClick={(e) => criarConta(e)}>Registrar-se</button>
                        <p>Já tem uma Conta? <span onClick={() => setContainerLogar(!containerLogar)}>Logar-se</span></p>
                    </div>
                }

                {/* Modal para redefinição de senha */}
                {showResetPassword && (
                    <div className="reset-password-modal">
                        <div className="reset-password-content">
                            <h2>Redefinir Senha</h2>
                            <input
                                type="email"
                                placeholder="Digite seu e-mail"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                            <button onClick={(e) => enviarEmailRedefinicaoSenha(e)}>Enviar E-mail de Redefinição</button>
                            <button onClick={() => setShowResetPassword(false)}>Fechar</button>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    )
}

export default LoginRegistro;