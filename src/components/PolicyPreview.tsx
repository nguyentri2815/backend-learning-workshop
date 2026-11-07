import { ArrowDown, FileCheck2, Play, RotateCcw } from "lucide-react";
import { Field } from "./Field";
import { AsyncMessage } from "./AsyncMessage";
import type { DemoPolicy } from "../state";

export function PolicyPreview({ demo }: { demo: DemoPolicy }) {
  return (
    <section className="card policy-preview">
      <div className="section-heading">
        <div>
          <span className="eyebrow">KỊCH BẢN MẪU</span>
          <h3>Tạo và đọc một Policy</h3>
        </div>
        <span className="tiny-label">Bộ nhớ UI</span>
      </div>
      <p className="muted">
        Một ví dụ để quan sát kết quả. Không gửi HTTP request. Tạo lại sẽ thay
        bản ghi mẫu; reload xóa bộ nhớ.
      </p>
      <div className="segmented" aria-label="Kịch bản Policy">
        <button
          aria-pressed={demo.operation === "create"}
          onClick={() => demo.setOperation("create")}
          disabled={demo.loading}
        >
          Tạo Policy mẫu
        </button>
        <button
          aria-pressed={demo.operation === "read"}
          onClick={() => demo.setOperation("read")}
          disabled={demo.loading}
        >
          Đọc Policy mẫu
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          demo.run();
        }}
        noValidate
      >
        <fieldset disabled={demo.loading}>
          {demo.operation === "create" ? (
            <Field
              id="holderName"
              label="Tên bên mua minh họa"
              error={demo.fieldError}
              hint="Chỉ phục vụ ví dụ giao diện, không nhập dữ liệu cá nhân."
            >
              <input
                id="holderName"
                value={demo.name}
                onChange={(e) => demo.setName(e.target.value)}
                aria-required="true"
                aria-invalid={Boolean(demo.fieldError)}
                aria-describedby={`holderName-hint${demo.fieldError ? " holderName-error" : ""}`}
                placeholder="Ví dụ: Khách hàng minh họa"
                autoComplete="off"
              />
            </Field>
          ) : (
            <div className="read-target">
              <FileCheck2 size={20} />
              <div>
                <small>ID minh họa</small>
                <strong>POL-DEMO-001</strong>
              </div>
              <span>{demo.record ? "Có trong bộ nhớ" : "Chưa được tạo"}</span>
            </div>
          )}
          <div className="actions">
            <button type="submit" className="button primary">
              <Play size={15} />
              {demo.loading
                ? "Đang mô phỏng…"
                : demo.operation === "create"
                  ? "Tạo Policy mẫu"
                  : "Đọc Policy mẫu"}
            </button>
            {demo.operation === "create" && (
              <button
                type="button"
                className="button subtle"
                onClick={() => demo.setName("Khách hàng minh họa")}
              >
                Điền mẫu
              </button>
            )}
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={demo.failNext}
              onChange={(e) => demo.setFailNext(e.target.checked)}
            />
            Gây lỗi lần mô phỏng kế tiếp
          </label>
        </fieldset>
      </form>
      <AsyncMessage
        loading={demo.loading}
        error={demo.error}
        retry={demo.run}
      />
      {demo.result && !demo.loading && !demo.error && (
        <div className="policy-result" role="status">
          <FileCheck2 size={22} />
          <div>
            <strong>
              {demo.exchange?.operation === "READ_POLICY"
                ? "Đã đọc từ bộ nhớ minh họa"
                : "Đã tạo trong bộ nhớ minh họa"}
            </strong>
            <p>
              {demo.result.id} · {demo.result.holderName}
            </p>
          </div>
        </div>
      )}
      <details className="exchange" open={Boolean(demo.exchange)}>
        <summary>
          Request / response mô phỏng <ArrowDown size={14} />
        </summary>
        {demo.exchange ? (
          <>
            <p className="caption">
              Lần mô phỏng gần nhất · {demo.exchange.operation} · không phải
              endpoint của repo
            </p>
            <div className="request-grid">
              <div>
                <span>REQUEST</span>
                <pre>{JSON.stringify(demo.exchange.request, null, 2)}</pre>
              </div>
              <div>
                <span>RESPONSE</span>
                <pre>
                  {demo.exchange.response
                    ? JSON.stringify(demo.exchange.response, null, 2)
                    : "Đang chờ phản hồi mô phỏng…"}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="empty compact">
            <RotateCcw size={22} />
            <p>
              Chưa có lượt mô phỏng. Tạo hoặc đọc mẫu để xem dữ liệu vào/ra.
            </p>
          </div>
        )}
      </details>
    </section>
  );
}
