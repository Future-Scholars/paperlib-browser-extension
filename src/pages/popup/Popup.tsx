import React from 'react';
import '@pages/popup/Popup.css';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';

type Status = 'Added' | 'Failed';

const Popup = () => {
  const [status, setStatus] = React.useState<Status>();
  const [process, setProcess] = React.useState<boolean>(false);

  const handleClick = async e => {
    e.preventDefault();

    setProcess(true);

    const taburl = await chrome.runtime.sendMessage({ action: 'tabinfo', message: '' });
    const resp = await chrome.runtime.sendMessage({
      action: 'add',
      message: {
        url: taburl.response.url,
        document: taburl.response.document,
        cookies: taburl.response.cookies,
      },
    });

    setProcess(false);
    setStatus(resp.response);
  };

  return (
    <div>
      {process && <div className="w-full loader"></div>}
      {status ? (
        <ProcessResult status={status} />
      ) : (
        <div className="flex flex-col justify-between m-4">
          <div>
            <div className="flex justify-between mb-5">
              <div className="flex flex-col max-w-[90%]">
                <div className="text-xs font-semibold">是否下载 PDF</div>
                <div className="text-xxs text-neutral-600 dark:text-neutral-500">否则仅添加条目信息</div>
              </div>
              <div></div>
              <button
                id="headlessui-switch-3"
                role="switch"
                type="button"
                tabIndex={0}
                aria-checked="true"
                className="bg-neutral-500 dark:bg-neutral-400 my-auto relative inline-flex h-5 w-10 items-center rounded-full min-w-10">
                <span className="translate-x-5.5 inline-block h-4 w-4 transform rounded-full bg-neutral-100 dark:bg-neutral-800 transition ease-in-out"></span>
              </button>
            </div>

            <div className="flex justify-between mb-5">
              <div className="flex flex-col max-w-[90%]">
                <div className="text-xs font-semibold">标签</div>
                <div className="text-xxs text-neutral-600 dark:text-neutral-500">标签</div>
              </div>
              <div>
                <select
                  id="language"
                  className="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                  <option value="en-GB">test 1</option>
                  <option value="zh-CN">test 2</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mb-5">
              <div className="flex flex-col max-w-[90%]">
                <div className="text-xs font-semibold">组</div>
                <div className="text-xxs text-neutral-600 dark:text-neutral-500">组</div>
              </div>
              <div>
                <select
                  id="language"
                  className="my-auto bg-gray-50 border text-xxs border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-28 h-6 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                  <option value="en-GB">test 1</option>
                  <option value="zh-CN">test 2</option>
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={async e => await handleClick(e)}
            className="flex h-6 rounded-md bg-neutral-300 dark:bg-neutral-600 dark:text-neutral-300 hover:shadow-sm cursor-pointer">
            <span className="m-auto text-xs">Add to Paperlib</span>
          </button>
        </div>
      )}
    </div>
  );
};

const ProcessResult = (props: { status: Status }) => {
  const { status } = props;
  return <div className="m-4">{status}</div>;
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
