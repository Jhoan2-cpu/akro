<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu correo de perfil</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f4f7f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #17342b;
        }

        .wrapper {
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
        }

        .card {
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        .header {
            background: #eff8f2;
            padding: 30px 32px 26px;
            text-align: center;
        }

        .brand-mark {
            display: inline-flex;
            align-items: center;
            gap: 14px;
            margin: 0 auto;
            padding: 16px 22px;
            background: #ffffff;
            border: 1px solid #d8eadf;
            border-radius: 18px;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        }

        .brand-icon {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: linear-gradient(135deg, #0f7a5b, #0c5f47);
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            line-height: 1;
            font-weight: 700;
            flex: 0 0 auto;
        }

        .brand-text {
            text-align: left;
        }

        .brand-kicker {
            color: #0f7a5b;
            font-size: 12px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .brand-name {
            color: #17342b;
            font-size: 18px;
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: 0.02em;
        }

        .content {
            padding: 32px;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: #dcfce7;
            color: #166534;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 16px;
        }

        h1 {
            margin: 0 0 12px;
            font-size: 26px;
            line-height: 1.2;
        }

        p {
            margin: 0 0 16px;
            line-height: 1.6;
        }

        .email-box {
            margin: 20px 0;
            padding: 16px 18px;
            background: #f8faf9;
            border: 1px solid #d7e5dd;
            border-radius: 14px;
            font-size: 15px;
        }

        .button {
            display: inline-block;
            margin-top: 8px;
            background: #0f7a5b;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 700;
            padding: 14px 20px;
            border-radius: 12px;
        }

        .support-box {
            margin-top: 24px;
            padding: 16px 18px;
            background: #ecfdf3;
            border-left: 4px solid #0f7a5b;
            border-radius: 12px;
            color: #14532d;
        }

        .footer {
            padding: 0 32px 32px;
            color: #64748b;
            font-size: 13px;
        }

        .footer a {
            color: #0f7a5b;
            text-decoration: none;
            font-weight: 700;
        }

        @media (max-width: 640px) {
            .content,
            .footer,
            .header {
                padding-left: 20px;
                padding-right: 20px;
            }

            .brand-mark {
                width: 100%;
                box-sizing: border-box;
                justify-content: center;
            }

            .brand-text {
                text-align: center;
            }

            h1 {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <div class="brand-mark" role="img" aria-label="Farmacia San Lucas">
                    <div class="brand-icon">+</div>
                    <div class="brand-text">
                        <div class="brand-kicker">Farmacia</div>
                        <div class="brand-name">SAN LUCAS</div>
                    </div>
                </div>
            </div>

            <div class="content">
                <span class="badge">Verificación pendiente</span>
                <h1>Hola,</h1>
                <p>Solicitaste verificar este correo para tu perfil:</p>

                <div class="email-box">
                    <strong>{{ $verificationEmail }}</strong>
                </div>

                <p>Este correo puede ser el mismo de inicio de sesión o uno distinto, según tu preferencia.</p>
                <p>Haz clic en el botón para confirmar la dirección y completar la verificación.</p>

                <a class="button" href="{{ $verificationUrl }}">Verificar correo de perfil</a>

                <div class="support-box">
                    El enlace expira en {{ $expiresInMinutes }} minutos.
                    Si no solicitaste esta acción, puedes ignorar este mensaje.
                </div>
            </div>

            <div class="footer">
                Necesitas ayuda? Escríbenos a <a href="mailto:{{ $supportEmail }}">{{ $supportEmail }}</a>.
            </div>
        </div>
    </div>
</body>
</html>