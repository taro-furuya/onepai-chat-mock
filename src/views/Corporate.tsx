import React, { useState } from "react";
import Card from "../components/Card";

const Corporate: React.FC = () => {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [msg, setMsg] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("送信（ダミー）しました。ありがとうございます。");
  };

  return (
    <div className="container-narrow py-6 space-y-6">
      <Card title="法人向けお問い合わせ">
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="会社名" className="border rounded-xl px-3 h-10"/>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="ご担当者名" className="border rounded-xl px-3 h-10"/>
          </div>
          <input value={mail} onChange={e=>setMail(e.target.value)} placeholder="メールアドレス" className="border rounded-xl px-3 h-10 w-full"/>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="お問い合わせ内容" className="border rounded-xl p-3 w-full h-40"/>
          <div className="text-right">
            <button className="btn-primary" type="submit">送信</button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Corporate;
