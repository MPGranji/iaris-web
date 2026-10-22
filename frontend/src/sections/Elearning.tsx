import { useState } from 'react';
import type { Lesson, QuizAttemptResult, QuizQuestion } from '../../../shared/types';
import { ELEARNING_COURSE_CODE } from '../../../shared/content';
import { SectionHead } from '../components/SectionHead';
import { api } from '../api/client';

const EL_ITEMS = [
  {
    code: 'B6',
    title: 'Nhận thức an ninh mạng',
    text: '6 bài × 15 phút cho toàn bộ nhân viên, kèm bài kiểm tra và báo cáo cho doanh nghiệp.',
  },
  {
    code: 'BVDLCN',
    title: 'Gói nhận thức Luật Bảo vệ dữ liệu cá nhân',
    text: 'Liên ngành, đăng ký ngay từ Q4/2026 theo số lượng nhân sự.',
  },
  {
    code: 'NHÓM 3',
    title: 'E-learning theo ngành',
    text: 'Luật – kiểm toán, bất động sản, truyền thông, ô tô, phi lợi nhuận; kèm workshop 0,5 ngày.',
  },
  {
    code: 'MEDIA',
    title: 'Series Luật dễ hiểu',
    text: 'Mỗi tập 5–7 phút giải thích 4 đạo luật cốt lõi bằng ngôn ngữ doanh nghiệp.',
  },
];

/* ───────────── Learner portal preview (illustrative, local state only) ───────────── */
function Portal({ lessons }: { lessons: Lesson[] }) {
  const [done, setDone] = useState<Set<number>>(() => new Set([0, 1]));
  const [cur, setCur] = useState(0);
  const total = lessons.length;
  const lesson = lessons[cur];

  const markDone = () => {
    setDone((d) => new Set(d).add(cur));
    if (cur < total - 1) setCur(cur + 1);
  };

  return (
    <div className="portal" aria-label="Xem trước cổng học viên">
      <div className="portal-bar">
        <i />
        <i />
        <i />
        <span className="mono">Cổng học viên IARIS · {ELEARNING_COURSE_CODE}</span>
        <span className="lock mono">● Kết nối bảo mật</span>
      </div>
      <div className="portal-body">
        <div className="lessons">
          <h4>{ELEARNING_COURSE_CODE} · Nhận thức an ninh mạng</h4>
          <div id="lessonList">
            {lessons.map((l, i) => (
              <button
                key={l.position}
                className={`lesson ${done.has(i) ? 'done' : ''}`}
                type="button"
                aria-current={i === cur}
                onClick={() => setCur(i)}
              >
                <span className="n">{done.has(i) ? '✓' : i + 1}</span>
                <span>{l.title}</span>
                <small>{l.durationMin}'</small>
              </button>
            ))}
          </div>
        </div>
        <div className="player">
          <span className="example">Bản xem trước · dữ liệu minh họa</span>
          <div className="screen">
            <span className="play" aria-hidden="true" />
            <div>
              <small id="lsNum">
                Bài {cur + 1} · {lesson?.durationMin ?? 15} phút
              </small>
              <b id="lsTitle">{lesson?.title}</b>
            </div>
          </div>
          <div className="prog-row">
            <span>Tiến độ khóa học</span>
            <span id="progTxt">
              {done.size}/{total} bài
            </span>
          </div>
          <div className="progress">
            <span id="progBar" style={{ width: `${total ? (done.size / total) * 100 : 0}%` }} />
          </div>
          <p id="lsDesc">{lesson?.summary}</p>
          <button className="btn btn-ghost" id="markDone" type="button" onClick={markDone}>
            {done.has(cur) ? 'Đã hoàn thành bài này' : 'Đánh dấu đã học bài này'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Quick scam-awareness quiz ───────────── */
function Quiz({ quiz, persist }: { quiz: QuizQuestion[]; persist: boolean }) {
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const total = quiz.length;
  const q = quiz[qi];
  const picked = answers[qi];
  const answered = picked !== undefined;
  const score = answers.filter((a, i) => a === quiz[i]?.correctIndex).length;

  const pick = (i: number) => {
    if (answered) return;
    const next = [...answers];
    next[qi] = i;
    setAnswers(next);
  };

  const goNext = () => {
    if (qi < total - 1) {
      setQi(qi + 1);
      return;
    }
    setFinished(true);
    if (!persist) return;
    // Fire-and-forget: the server re-scores and records the attempt for analytics.
    api
      .post<QuizAttemptResult>('/quiz-attempts', { courseCode: ELEARNING_COURSE_CODE, answers })
      .catch(() => undefined);
  };

  const restart = () => {
    setQi(0);
    setAnswers([]);
    setFinished(false);
  };

  return (
    <div className="quiz" id="quiz">
      <span className="mono" style={{ color: 'var(--copper)' }}>
        Thử nhanh · {total} tình huống
      </span>
      <h3>Bạn có nhận ra lừa đảo?</h3>
      <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
        Một phần bài kiểm tra cuối khóa {ELEARNING_COURSE_CODE}. Chọn cách xử lý đúng.
      </p>

      <div className="q" id="qBox">
        {finished ? (
          <>
            <b style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem' }}>
              {score}/{total} tình huống đúng
            </b>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>
              {score === total
                ? 'Bạn đã có phản xạ tốt. Hãy giúp đồng nghiệp làm được như bạn với khóa B6.'
                : 'Khóa B6 giúp mọi nhân viên có phản xạ đúng trước lừa đảo và deepfake.'}
            </p>
            <div className="cta" style={{ marginTop: 14 }}>
              <a className="btn btn-primary" href="#contact">
                Đăng ký B6 cho doanh nghiệp
              </a>
              <button className="btn btn-ghost" type="button" id="qAgain" onClick={restart}>
                Làm lại
              </button>
            </div>
          </>
        ) : (
          q && (
            <>
              <b>{q.scenario}</b>
              <div className="msg">{q.message}</div>
              <div className="answers" key={qi}>
                {q.options.map((opt, i) => {
                  const cls = answered ? (i === q.correctIndex ? 'right' : i === picked ? 'wrong' : '') : '';
                  return (
                    <button key={i} type="button" className={cls || undefined} disabled={answered} onClick={() => pick(i)}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="feedback" aria-live="polite">
                {answered && (
                  <>
                    <b style={{ color: picked === q.correctIndex ? 'var(--signal)' : 'var(--copper)' }}>
                      {picked === q.correctIndex ? 'Chính xác.' : 'Chưa đúng.'}
                    </b>{' '}
                    {q.explanation}
                  </>
                )}
              </div>
            </>
          )
        )}
      </div>

      <div className="qnav">
        <span id="qCount">{finished ? 'Hoàn thành' : `Tình huống ${qi + 1}/${total}`}</span>
        <button
          className="btn btn-ghost"
          id="qNext"
          type="button"
          style={{ padding: '8px 14px' }}
          hidden={finished || !answered}
          onClick={goNext}
        >
          {qi < total - 1 ? 'Tiếp theo' : 'Xem kết quả'}
        </button>
      </div>
    </div>
  );
}

export function Elearning({ lessons, quiz, persist = false }: { lessons: Lesson[]; quiz: QuizQuestion[]; persist?: boolean }) {
  return (
    <section className="block alt" id="elearning">
      <div className="wrap">
        <SectionHead eyebrow="E-learning" title="Học mọi lúc, cho mọi nhân viên">
          Nền tảng học trực tuyến của IARIS ra mắt H1/2027, phục vụ đào tạo nhận thức cho toàn bộ nhân viên và gói tuân thủ
          theo ngành. Doanh nghiệp nhận báo cáo hoàn thành cho từng học viên.
        </SectionHead>

        <div className="el-grid">
          <Portal lessons={lessons} />
          <Quiz quiz={quiz} persist={persist} />
        </div>

        <div className="el-list">
          {EL_ITEMS.map((e) => (
            <div className="el-item" key={e.code}>
              <span className="code">{e.code}</span>
              <b>{e.title}</b>
              <p>{e.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
